import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, revealEverything, settleCookieBanner } from './fixtures'

const PAGES = [
  '/', '/join', '/classes', '/events', '/giving', '/community', '/prayer',
  '/contact', '/partner', '/vision', '/pastor', '/devotionals',
  '/privacy-policy', '/terms-and-service',
]
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe.configure({ mode: 'serial', timeout: 90_000 })

const file = (project: string) => `a11y-results-${project}.jsonl`

test.beforeAll(({}, testInfo) => {
  if (existsSync(file(testInfo.project.name))) rmSync(file(testInfo.project.name))
})

for (const path of PAGES) {
  test(`scan ${path}`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => {})
    await settleCookieBanner(page)
    await revealEverything(page)
    const scan = await new AxeBuilder({ page }).withTags(TAGS).analyze()

    const violations = scan.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? 'minor',
      help: v.help,
      nodes: v.nodes.length,
      samples: v.nodes.slice(0, 3).map((n) => ({
        target: String(n.target),
        html: n.html.replace(/\s+/g, ' ').slice(0, 140),
      })),
    }))
    appendFileSync(file(testInfo.project.name), JSON.stringify({ path, violations }) + '\n')

    if (process.env.A11Y_STRICT === '1') {
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(bad, 'serious or critical problems').toEqual([])
    }
  })
}

test.afterAll(({}, testInfo) => {
  const name = testInfo.project.name
  if (!existsSync(file(name))) return
  const rows = readFileSync(file(name), 'utf8').trim().split('\n').map((l) => JSON.parse(l))

  const rules = new Map<string, { impact: string; help: string; nodes: number; pages: Set<string> }>()
  const lines: string[] = []
  for (const row of rows) {
    lines.push(`\n${row.path}  (${row.violations.length} problem${row.violations.length === 1 ? '' : 's'})`)
    for (const v of row.violations) {
      lines.push(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes} places)`)
      for (const s of v.samples) lines.push(`      ${s.target}`, `      ${s.html}`)
      const r = rules.get(v.id) ?? { impact: v.impact, help: v.help, nodes: 0, pages: new Set<string>() }
      r.nodes += v.nodes
      r.pages.add(row.path)
      rules.set(v.id, r)
    }
  }
  const summary = [...rules.entries()]
    .sort((a, b) => b[1].nodes - a[1].nodes)
    .map(([id, r]) => `  [${r.impact}] ${id}: ${r.help}: ${r.nodes} places on ${r.pages.size} pages`)

  const report = [
    `Accessibility scan (${name})`, '', 'MOST COMMON PROBLEMS',
    ...(summary.length ? summary : ['  none found']), '', 'BY PAGE', ...lines,
  ].join('\n')
  writeFileSync(`a11y-report-${name}.txt`, report)
  console.log(report)
})