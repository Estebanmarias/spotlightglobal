import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const mapped = new Set(
  [...readFileSync('components/Icon.tsx', 'utf8').matchAll(/\b([a-z][a-z0-9_]*):\s*[A-Z][A-Za-z0-9]*/g)].map(m => m[1]),
)
const used = new Map()
const add = (name, file) => used.set(name, [...(used.get(name) ?? []), file])

function scan(file) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/\bicon:\s*['"]([a-z][a-z0-9_]*)['"]/g)) add(m[1], file)
  for (const m of text.matchAll(/<Icon\s+name=["']([a-z][a-z0-9_]*)["']/g)) add(m[1], file)
  for (const m of text.matchAll(/name=\{[^}]*?\?\s*['"]([a-z][a-z0-9_]*)['"]\s*:\s*['"]([a-z][a-z0-9_]*)['"]/g)) {
    add(m[1], file)
    add(m[2], file)
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.tsx?$/.test(full) && !full.endsWith('Icon.tsx')) scan(full)
  }
}

for (const dir of ['app', 'components', 'lib']) walk(dir)

const missing = [...used].filter(([name]) => !mapped.has(name)).sort(([a], [b]) => a.localeCompare(b))
if (!missing.length) {
  console.log('Every icon name is mapped.')
} else {
  console.log('Not in the Icon map (these show blank):')
  for (const [name, files] of missing) console.log(`  ${name}  <-  ${[...new Set(files)].join(', ')}`)
}