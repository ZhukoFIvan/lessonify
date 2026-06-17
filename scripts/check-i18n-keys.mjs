#!/usr/bin/env node
// CI-проверка паритета ключей в словарях ru/en/uk.
// ru — источник истины. Падает (exit 1), если в en/uk не хватает ключей,
// есть лишние, или ICU-плейсхолдеры расходятся.
//
// Запуск: node scripts/check-i18n-keys.mjs

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = 'apps/web/src/i18n/messages'
const SOURCE = 'ru'
const TARGETS = ['en', 'uk']

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

function leaves(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) Object.assign(out, leaves(v, path))
    else out[path] = v
  }
  return out
}

// Извлекаем плейсхолдеры {name}, {count}. Сначала вырезаем тела ICU plural/select
// категорий (one {…}, other {…}, =0 {…}) — иначе переведённые слова внутри них
// (англ. {use}/{uses}) ложно считаются плейсхолдерами, а кириллические — нет.
function placeholders(str) {
  if (typeof str !== 'string') return new Set()
  const stripped = str.replace(/\b(?:zero|one|two|few|many|other|=\d+)\s*\{[^{}]*\}/g, '')
  const set = new Set()
  for (const m of stripped.matchAll(/\{\s*([a-zA-Z0-9_]+)\s*(?:,|\})/g)) set.add(m[1])
  return set
}

const dicts = {}
for (const loc of [SOURCE, ...TARGETS]) {
  dicts[loc] = leaves(JSON.parse(readFileSync(join(MESSAGES_DIR, `${loc}.json`), 'utf8')))
}

const sourceKeys = new Set(Object.keys(dicts[SOURCE]))
let problems = 0

for (const loc of TARGETS) {
  const keys = new Set(Object.keys(dicts[loc]))
  const missing = [...sourceKeys].filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !sourceKeys.has(k))

  if (missing.length) {
    problems += missing.length
    console.error(`✗ [${loc}] не хватает ${missing.length} ключей:`)
    for (const k of missing.slice(0, 50)) console.error(`    ${k}`)
    if (missing.length > 50) console.error(`    … ещё ${missing.length - 50}`)
  }
  if (extra.length) {
    problems += extra.length
    console.error(`✗ [${loc}] лишние ${extra.length} ключей (нет в ${SOURCE}):`)
    for (const k of extra.slice(0, 50)) console.error(`    ${k}`)
  }

  // Сверяем плейсхолдеры по общим ключам
  for (const k of sourceKeys) {
    if (!keys.has(k)) continue
    const a = placeholders(dicts[SOURCE][k])
    const b = placeholders(dicts[loc][k])
    const diff = [...a].filter((p) => !b.has(p)).concat([...b].filter((p) => !a.has(p)))
    if (diff.length) {
      problems++
      console.error(`✗ [${loc}] расхождение плейсхолдеров в "${k}": {${[...a]}} vs {${[...b]}}`)
    }
  }
}

if (problems === 0) {
  const total = sourceKeys.size
  console.log(`✓ i18n ключи согласованы: ${total} ключей × ${[SOURCE, ...TARGETS].length} языка.`)
  process.exit(0)
} else {
  console.error(`\n✗ Найдено проблем: ${problems}. Исправьте словари.`)
  process.exit(1)
}
