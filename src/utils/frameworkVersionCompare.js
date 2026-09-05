import { DOMAIN_LABELS, DOMAINS } from './domainConstants.js'
import { FRAMEWORK_VERSION_STATUS_LABELS } from './frameworkVersionConstants.js'

export function formatVersionCompareOptionLabel(entry) {
  const status = FRAMEWORK_VERSION_STATUS_LABELS[entry.status] ?? entry.status
  const isLive =
    entry.frameworkGroup?.activeProductionFrameworkVersionId &&
    String(entry.frameworkGroup.activeProductionFrameworkVersionId) === String(entry._id)
  const liveSuffix = isLive ? ' · Live' : ''
  return `v${entry.version} — ${entry.name} (${status})${liveSuffix}`
}

export function domainCompareLabel(domain) {
  return DOMAIN_LABELS[domain] ?? domain
}

function contentByDomain(descriptions = []) {
  return new Map((descriptions ?? []).map((entry) => [entry.domain, entry.content ?? '']))
}

/** Ordered domain keys present in either version. */
export function orderedCompareDomains(leftDescriptions, rightDescriptions) {
  const present = new Set([
    ...(leftDescriptions ?? []).map((entry) => entry.domain),
    ...(rightDescriptions ?? []).map((entry) => entry.domain),
  ])
  const known = DOMAINS.filter((domain) => present.has(domain))
  const extra = [...present].filter((domain) => !DOMAINS.includes(domain)).sort()
  return [...known, ...extra]
}

/**
 * Line-level LCS diff.
 * ponytail: O(n*m) table — fine for stylist markdown; switch to Myers if files get huge.
 */
export function diffLines(leftText = '', rightText = '') {
  const left = String(leftText).split('\n')
  const right = String(rightText).split('\n')
  const n = left.length
  const m = right.length

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const ops = []
  let i = 0
  let j = 0
  let leftLine = 1
  let rightLine = 1

  while (i < n && j < m) {
    if (left[i] === right[j]) {
      ops.push({ type: 'equal', text: left[i], leftLine, rightLine })
      i += 1
      j += 1
      leftLine += 1
      rightLine += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'remove', text: left[i], leftLine, rightLine: null })
      i += 1
      leftLine += 1
    } else {
      ops.push({ type: 'add', text: right[j], leftLine: null, rightLine })
      j += 1
      rightLine += 1
    }
  }

  while (i < n) {
    ops.push({ type: 'remove', text: left[i], leftLine, rightLine: null })
    i += 1
    leftLine += 1
  }
  while (j < m) {
    ops.push({ type: 'add', text: right[j], leftLine: null, rightLine })
    j += 1
    rightLine += 1
  }

  return ops
}

/** Build per-domain content diffs for two domain-description payloads. */
export function diffDomainDescriptionContents(leftDescriptions, rightDescriptions) {
  const leftMap = contentByDomain(leftDescriptions)
  const rightMap = contentByDomain(rightDescriptions)
  const domains = orderedCompareDomains(leftDescriptions, rightDescriptions)

  return domains.map((domain) => {
    const leftMissing = !leftMap.has(domain)
    const rightMissing = !rightMap.has(domain)
    const left = leftMissing ? '' : leftMap.get(domain)
    const right = rightMissing ? '' : rightMap.get(domain)
    const lines = diffLines(left, right)
    const changed =
      leftMissing !== rightMissing || lines.some((line) => line.type !== 'equal')

    return {
      domain,
      label: domainCompareLabel(domain),
      left,
      right,
      leftMissing,
      rightMissing,
      lines,
      changed,
      changeCount: lines.filter((line) => line.type !== 'equal').length,
    }
  })
}
