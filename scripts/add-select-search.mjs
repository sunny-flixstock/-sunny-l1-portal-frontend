import fs from 'fs'
import path from 'path'

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (/\.(jsx|js)$/.test(ent.name)) out.push(p)
  }
  return out
}

const files = walk('src').filter((f) => {
  const t = fs.readFileSync(f, 'utf8')
  return t.includes('<Select') && /from ['"]antd['"]/.test(t) && /\bSelect\b/.test(t)
})

let changedFiles = 0
let changedSelects = 0

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8')
  let fileChanged = false

  const next = text.replace(/<Select(\s[^>]*?)>/g, (full, attrs) => {
    if (/\bshowSearch\b/.test(attrs)) {
      if (!/\boptionFilterProp\b/.test(attrs)) {
        changedSelects++
        fileChanged = true
        const newAttrs = attrs.replace(
          /\bshowSearch\b/,
          'showSearch\n              optionFilterProp="label"',
        )
        return `<Select${newAttrs}>`
      }
      return full
    }
    changedSelects++
    fileChanged = true
    const indentMatch = attrs.match(/\n(\s*)/)
    const indent = indentMatch ? indentMatch[1] : '  '
    const injection = `\n${indent}showSearch\n${indent}optionFilterProp="label"`
    return `<Select${injection}${attrs}>`
  })

  if (fileChanged) {
    fs.writeFileSync(file, next)
    changedFiles++
    console.log('updated', file)
  }
}

console.log({ changedFiles, changedSelects })
