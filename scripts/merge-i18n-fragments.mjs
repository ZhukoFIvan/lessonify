#!/usr/bin/env node
// Сливает фрагменты словарей, сгенерированные агентами Фазы 4, в основные
// словари apps/web/src/i18n/messages/{ru,en,uk}.json.
//
// Каждый фрагмент _fragments/<ns>.json имеет вид { ru:{...}, en:{...}, uk:{...} },
// где объект — это СОДЕРЖИМОЕ неймспейса <ns> (без префикса). Глубокий мердж
// сохраняет уже существующие ключи (например auth.login.*).
//
// Запуск: node scripts/merge-i18n-fragments.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = 'apps/web/src/i18n/messages'
const FRAGMENTS_DIR = join(MESSAGES_DIR, '_fragments')
const LOCALES = ['ru', 'en', 'uk']

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

function deepMerge(target, source) {
  const out = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

// 1. Базовые словари
const dicts = {}
for (const loc of LOCALES) {
  dicts[loc] = readJson(join(MESSAGES_DIR, `${loc}.json`))
}

// 2. Фрагменты
if (!existsSync(FRAGMENTS_DIR)) {
  console.error(`Нет директории фрагментов: ${FRAGMENTS_DIR}`)
  process.exit(1)
}
const fragmentFiles = readdirSync(FRAGMENTS_DIR).filter((f) => f.endsWith('.json'))
if (fragmentFiles.length === 0) {
  console.error('Фрагменты не найдены — нечего сливать.')
  process.exit(1)
}

let merged = 0
const report = []
for (const file of fragmentFiles.sort()) {
  const ns = file.replace(/\.json$/, '')
  let frag
  try {
    frag = readJson(join(FRAGMENTS_DIR, file))
  } catch (e) {
    console.error(`✗ Невалидный JSON в фрагменте ${file}: ${e.message}`)
    process.exitCode = 2
    continue
  }
  for (const loc of LOCALES) {
    const sub = frag[loc] ?? {}
    dicts[loc][ns] = deepMerge(dicts[loc][ns] ?? {}, sub)
  }
  const keyCount = countLeaves(frag.ru ?? {})
  report.push(`  ${ns}: ${keyCount} ключей`)
  merged++
}

// 3. Записываем обратно (стабильный порядок ключей не навязываем — оставляем как есть)
for (const loc of LOCALES) {
  writeFileSync(join(MESSAGES_DIR, `${loc}.json`), JSON.stringify(dicts[loc], null, 2) + '\n', 'utf8')
}

function countLeaves(obj) {
  let n = 0
  for (const v of Object.values(obj)) n += isPlainObject(v) ? countLeaves(v) : 1
  return n
}

console.log(`Слито неймспейсов: ${merged}`)
console.log(report.join('\n'))
console.log('Словари ru/en/uk обновлены.')
