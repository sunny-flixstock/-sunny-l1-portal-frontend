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

let fixed = 0

for (const file of walk('src')) {
  let text = fs.readFileSync(file, 'utf8')
  if (!text.includes('<Select')) continue

  const next = text.replace(/<Select(\s[^>]*?)>/g, (full, attrs) => {
    let a = attrs

    // Deduplicate showSearch
    const showSearchCount = (a.match(/\bshowSearch\b/g) || []).length
    if (showSearchCount > 1) {
      a = a.replace(/\bshowSearch\b/g, '___SHOWSEARCH___')
      a = a.replace('___SHOWSEARCH___', 'showSearch')
      a = a.replace(/\n\s*___SHOWSEARCH___/g, '')
      a = a.replace(/\s*___SHOWSEARCH___/g, '')
    }

    // Deduplicate optionFilterProp
    const filterMatches = [...a.matchAll(/\n?\s*optionFilterProp="[^"]*"/g)]
    if (filterMatches.length > 1) {
      // keep first, remove rest
      let seen = false
      a = a.replace(/\n?\s*optionFilterProp="[^"]*"/g, (m) => {
        if (!seen) {
          seen = true
          return m.startsWith('\n') ? m : `\n              optionFilterProp="label"`
        }
        return ''
      })
    }

    // Normalize: ensure showSearch then optionFilterProp near the top
    // Fix weird indentation like "showSearch\n              optionFilterProp" after existing showSearch line with wrong indent
    a = a.replace(/\n\s+optionFilterProp=/g, '\n              optionFilterProp=')

    if (a !== attrs) {
      fixed++
      return `<Select${a}>`
    }
    return full
  })

  if (next !== text) {
    fs.writeFileSync(file, next)
    console.log('cleaned', file)
  }
}

console.log({ fixed })
