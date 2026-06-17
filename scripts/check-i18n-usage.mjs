#!/usr/bin/env node
// Статически сверяет литеральные вызовы t('key') / t.rich('key') в коде
// с наличием ключа в ru.json. Ловит «ключ есть в коде, но нет в словаре»
// (сборка такое не ловит — next-intl покажет сам ключ в рантайме).
//
// Динамические ключи (t(variable), t(`a.${x}`), t('a.' + b)) пропускаются и
// считаются отдельно. Запуск: node scripts/check-i18n-usage.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'apps/web/src'
const RU = 'apps/web/src/i18n/messages/ru.json'

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
function leafSet(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) leafSet(v, p, out)
    else out.add(p)
  }
  return out
}
const leaves = leafSet(JSON.parse(readFileSync(RU, 'utf8')))

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '_fragments' || name === 'node_modules') continue
      walk(full, files)
    } else if (/\.(tsx?|ts)$/.test(name)) {
      files.push(full)
    }
  }
  return files
}

const DECL = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*'([^']*)'\s*\)/g

let missing = []
let dynamic = 0
let checked = 0

for (const file of walk(SRC)) {
  const code = readFileSync(file, 'utf8')

  // ident -> множество неймспейсов (учитываем шадовинг в разных компонентах)
  const nsByIdent = new Map()
  for (const m of code.matchAll(DECL)) {
    const [, ident, ns] = m
    if (!nsByIdent.has(ident)) nsByIdent.set(ident, new Set())
    nsByIdent.get(ident).add(ns)
  }
  if (nsByIdent.size === 0) continue

  for (const [ident, namespaces] of nsByIdent) {
    // Статический ключ — только одинарные/двойные кавычки: <ident>('key' / <ident>.rich("key"
    const useRe = new RegExp('\\b' + ident + '(?:\\.rich)?\\(\\s*([\'"])([^\'"]*)\\1', 'g')
    // Динамические — первый аргумент это backtick-шаблон или переменная/идентификатор
    const dynRe = new RegExp('\\b' + ident + '(?:\\.rich)?\\(\\s*[`A-Za-z_$]', 'g')
    for (const _ of code.matchAll(dynRe)) dynamic++

    for (const m of code.matchAll(useRe)) {
      const key = m[2]
      checked++
      const ok = [...namespaces].some((ns) => {
        const full = ns ? `${ns}.${key}` : key
        return leaves.has(full)
      })
      if (!ok) {
        missing.push(`${file.replace(SRC + '/', '')}: ${[...namespaces].map((n) => n || '(root)').join('|')}.${key}`)
      }
    }
  }
}

console.log(`Проверено литеральных ключей: ${checked}; динамических пропущено: ${dynamic}`)
if (missing.length) {
  console.error(`\n✗ Ключи, использованные в коде, но отсутствующие в ru.json (${missing.length}):`)
  for (const m of missing) console.error('   ' + m)
  process.exit(1)
} else {
  console.log('✓ Все литеральные t()-ключи присутствуют в словаре.')
}
