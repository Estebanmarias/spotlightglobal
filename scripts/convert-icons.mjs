import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const WRITE = process.argv.includes('--write')
const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
const roots = args.length ? args : ['app', 'components']
const SKIP = new Set(['components/Icon.tsx', 'components/BrandIcon.tsx'])

const iconSource = readFileSync('components/Icon.tsx', 'utf8')
const mapped = new Set([...iconSource.matchAll(/\b([a-z][a-z0-9_]*):\s*[A-Z][A-Za-z0-9]*/g)].map(m => m[1]))

const STYLE = String.raw`(?:\s+style=\{\{[^}]*\}\})?`
const STATIC = new RegExp(
  String.raw`<span\s+className="material-symbols-outlined([^"]*)"${STYLE}\s*>\s*([a-z0-9_]+)\s*</span>`, 'g')
const DYNAMIC = new RegExp(
  String.raw`<span\s+className="material-symbols-outlined([^"]*)"${STYLE}\s*>\s*\{([^{}]+)\}\s*</span>`, 'g')

const cls = c => {
  const t = c.trim().replace(/\s+/g, ' ')
  return t ? ` className="${t}"` : ''
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.tsx')) out.push(full)
  }
  return out
}

const unmapped = new Map()
const leftovers = []
const touched = []
let total = 0

for (const file of roots.flatMap(r => walk(r))) {
  const rel = relative(process.cwd(), file).split(sep).join('/')
  if (SKIP.has(rel)) continue
  const original = readFileSync(file, 'utf8')
  if (!original.includes('material-symbols-outlined')) continue

  let converted = 0
  let text = original.replace(STATIC, (full, classes, name) => {
    if (!mapped.has(name)) {
      unmapped.set(name, (unmapped.get(name) ?? 0) + 1)
      return full
    }
    converted += 1
    return `<Icon name="${name}"${cls(classes)} />`
  })
  text = text.replace(DYNAMIC, (_full, classes, expr) => {
    converted += 1
    return `<Icon name={${expr.trim()}}${cls(classes)} />`
  })

  if (converted > 0 && !/from\s+['"]@\/components\/Icon['"]/.test(text)) {
    const last = [...text.matchAll(/^import\b[^;]*?\bfrom\s+['"][^'"]+['"];?/gm)].at(-1)
    if (last) {
      const end = last.index + last[0].length
      text = `${text.slice(0, end)}\nimport Icon from '@/components/Icon'${text.slice(end)}`
    } else {
      leftovers.push(`${rel}: add \`import Icon from '@/components/Icon'\` by hand`)
    }
  }

  text.split('\n').forEach((line, i) => {
    if (line.includes('material-symbols-outlined')) leftovers.push(`${rel}:${i + 1}`)
  })

  if (converted > 0) {
    touched.push(`${rel} (${converted})`)
    total += converted
    if (WRITE) writeFileSync(file, text)
  }
}

console.log(WRITE ? 'Converted:' : 'Would convert (dry run):')
touched.forEach(t => console.log(`  ${t}`))
console.log(`Total icons: ${total}`)
if (unmapped.size) {
  console.log('\nNot in the Icon map, left as Material:')
  ;[...unmapped].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`  ${n} x${c}`))
}
if (leftovers.length) {
  console.log('\nStill using material-symbols-outlined:')
  leftovers.forEach(l => console.log(`  ${l}`))
}
if (!WRITE) console.log('\nDry run only. Run again with --write to apply.')