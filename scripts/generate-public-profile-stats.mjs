import { mkdir, writeFile } from 'node:fs/promises'

const token = process.env.GITHUB_TOKEN
const username = process.env.PROFILE_USERNAME

if (!token || !username) {
  throw new Error('GITHUB_TOKEN and PROFILE_USERNAME are required')
}

const now = new Date()
const from = new Date(now)
from.setUTCFullYear(from.getUTCFullYear() - 1)

const query = `
  query ProfileStats($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      repositories(first: 100, ownerAffiliations: OWNER) {
        nodes {
          isFork
          isPrivate
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { totalContributions }
        totalCommitContributions
        totalPullRequestContributions
        totalRepositoryContributions
      }
    }
  }
`

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'nckhemanth-profile-stats',
  },
  body: JSON.stringify({
    query,
    variables: {
      login: username,
      from: from.toISOString(),
      to: now.toISOString(),
    },
  }),
})

if (!response.ok) {
  throw new Error(`GitHub GraphQL request failed: ${response.status}`)
}

const payload = await response.json()
if (payload.errors?.length) {
  throw new Error(payload.errors.map(({ message }) => message).join('; '))
}

const user = payload.data?.user
if (!user) {
  throw new Error(`GitHub user not found: ${username}`)
}

const repositories = user.repositories.nodes
const publicRepositories = repositories.filter(({ isPrivate }) => !isPrivate)
const ownedPublicRepositories = publicRepositories.filter(({ isFork }) => !isFork)
const contributions = user.contributionsCollection

const excludedLanguages = new Set([
  'Jupyter Notebook', 'PHP', 'C', 'Shell', 'Dockerfile', 'HTML', 'CSS',
  'Makefile', 'Vue', 'TSQL', 'EJS',
])
const languageTotals = new Map()

for (const repository of ownedPublicRepositories) {
  for (const edge of repository.languages?.edges ?? []) {
    if (excludedLanguages.has(edge.node.name)) continue
    const current = languageTotals.get(edge.node.name) ?? {
      bytes: 0,
      color: edge.node.color || '#8b5cf6',
    }
    current.bytes += edge.size
    languageTotals.set(edge.node.name, current)
  }
}

const languages = [...languageTotals.entries()]
  .map(([name, value]) => ({ name, ...value }))
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 6)
const languageBytes = languages.reduce((sum, language) => sum + language.bytes, 0)

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const stats = [
  ['Contributions (12 mo)', contributions.contributionCalendar.totalContributions],
  ['Commits (12 mo)', contributions.totalCommitContributions],
  ['Pull requests (12 mo)', contributions.totalPullRequestContributions],
  ['Public repositories', publicRepositories.length],
]

const statsRows = stats.map(([label, value], index) => {
  const column = index % 2
  const row = Math.floor(index / 2)
  const x = 28 + column * 232
  const y = 76 + row * 55
  return `
    <g transform="translate(${x} ${y})">
      <text class="value" x="0" y="0">${escapeXml(value)}</text>
      <text class="label" x="0" y="20">${escapeXml(label)}</text>
    </g>`
}).join('')

const statsSvg = `
<svg width="480" height="190" viewBox="0 0 480 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="stats-title stats-desc">
  <title id="stats-title">${escapeXml(username)} GitHub activity</title>
  <desc id="stats-desc">Current public GitHub activity refreshed from the GitHub GraphQL API.</desc>
  <style>
    .title { fill: #8b5cf6; font: 600 18px 'Segoe UI', Ubuntu, sans-serif; }
    .subtitle, .label { fill: #8b949e; font: 400 12px 'Segoe UI', Ubuntu, sans-serif; }
    .value { fill: #c9d1d9; font: 700 23px 'Segoe UI', Ubuntu, sans-serif; }
  </style>
  <rect x="0.5" y="0.5" width="479" height="189" rx="12" fill="#0d1117" stroke="#30363d"/>
  <text class="title" x="24" y="31">GitHub Activity</text>
  <text class="subtitle" x="24" y="49">Live public profile data · rolling 12 months</text>
  ${statsRows}
</svg>
`.trim()

let barX = 24
const barWidth = 312
const barSegments = languages.map((language) => {
  const width = languageBytes ? (language.bytes / languageBytes) * barWidth : 0
  const segment = `<rect x="${barX.toFixed(2)}" y="54" width="${width.toFixed(2)}" height="9" fill="${escapeXml(language.color)}"/>`
  barX += width
  return segment
}).join('')

const languageRows = languages.map((language, index) => {
  const percent = languageBytes ? (language.bytes / languageBytes) * 100 : 0
  const column = index % 2
  const row = Math.floor(index / 2)
  const x = 24 + column * 168
  const y = 96 + row * 46
  return `
    <g transform="translate(${x} ${y})">
      <circle cx="5" cy="-4" r="5" fill="${escapeXml(language.color)}"/>
      <text class="language" x="17" y="0">${escapeXml(language.name)}</text>
      <text class="percent" x="17" y="18">${percent.toFixed(1)}%</text>
    </g>`
}).join('')

const languagesSvg = `
<svg width="360" height="245" viewBox="0 0 360 245" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="languages-title languages-desc">
  <title id="languages-title">${escapeXml(username)} core languages</title>
  <desc id="languages-desc">Language distribution across owned public repositories, excluding generated and presentation languages.</desc>
  <style>
    .title { fill: #8b5cf6; font: 600 18px 'Segoe UI', Ubuntu, sans-serif; }
    .subtitle, .percent { fill: #8b949e; font: 400 11px 'Segoe UI', Ubuntu, sans-serif; }
    .language { fill: #c9d1d9; font: 600 12px 'Segoe UI', Ubuntu, sans-serif; }
  </style>
  <rect x="0.5" y="0.5" width="359" height="244" rx="12" fill="#0d1117" stroke="#30363d"/>
  <text class="title" x="24" y="29">Core Languages</text>
  <text class="subtitle" x="24" y="44">Owned public repositories · code languages only</text>
  <clipPath id="language-bar"><rect x="24" y="54" width="312" height="9" rx="4.5"/></clipPath>
  <g clip-path="url(#language-bar)">${barSegments}</g>
  ${languageRows}
</svg>
`.trim()

await mkdir('profile', { recursive: true })
const normalizeSvg = (svg) => `${svg.replace(/[ \t]+$/gm, '')}\n`
await Promise.all([
  writeFile('profile/github-stats.svg', normalizeSvg(statsSvg)),
  writeFile('profile/top-langs.svg', normalizeSvg(languagesSvg)),
])

console.log(JSON.stringify({
  publicRepositories: publicRepositories.length,
  ownedPublicRepositories: ownedPublicRepositories.length,
  contributions: contributions.contributionCalendar.totalContributions,
  commits: contributions.totalCommitContributions,
  pullRequests: contributions.totalPullRequestContributions,
  languages: languages.map(({ name, bytes }) => ({ name, bytes })),
}, null, 2))
