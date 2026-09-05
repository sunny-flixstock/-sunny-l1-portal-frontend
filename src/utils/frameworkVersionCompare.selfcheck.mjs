import assert from 'node:assert/strict'
import {
  diffDomainDescriptionContents,
  diffLines,
  orderedCompareDomains,
} from './frameworkVersionCompare.js'

const lineDiff = diffLines('a\nb\nc', 'a\nx\nc')
assert.deepEqual(
  lineDiff.map((row) => [row.type, row.text]),
  [
    ['equal', 'a'],
    ['remove', 'b'],
    ['add', 'x'],
    ['equal', 'c'],
  ],
)

const left = [
  { domain: 'styling', content: 'hello\nworld' },
  { domain: 'pose', content: 'stand' },
]
const right = [
  { domain: 'styling', content: 'hello\nthere' },
  { domain: 'pose', content: 'stand' },
  { domain: 'outfit_combination', content: 'mix' },
]

assert.deepEqual(orderedCompareDomains(left, right), [
  'outfit_combination',
  'styling',
  'pose',
])

const domains = diffDomainDescriptionContents(left, right)
assert.equal(domains.find((row) => row.domain === 'pose')?.changed, false)
assert.equal(domains.find((row) => row.domain === 'styling')?.changed, true)
assert.equal(domains.find((row) => row.domain === 'outfit_combination')?.changed, true)
assert.equal(domains.find((row) => row.domain === 'outfit_combination')?.leftMissing, true)

console.log('frameworkVersionCompare self-check ok')
