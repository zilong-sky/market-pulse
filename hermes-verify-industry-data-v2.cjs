// Ad-hoc verification: compile industry-data.ts to CJS and validate structure
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectDir = 'E:/workspace/codex-ws/market-pulse'
const tsFile = path.join(projectDir, 'server', 'utils', 'industry-data.ts')
const outFile = path.join(projectDir, 'hermes-verify-industry-data-compiled.cjs')

// 1. Compile TS to CJS JS using tsc transpile API
const ts = require('typescript')
const tsFile2 = path.join(projectDir, 'server', 'utils', 'industry-data.ts')
const source = fs.readFileSync(tsFile2, 'utf-8')

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
    esModuleInterop: true,
  },
  fileName: tsFile2,
})

if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
  console.error('Transpile diagnostics:', transpiled.diagnostics.map(d => d.messageText))
  process.exit(1)
}

const compiled = transpiled.outputText

// 3. Evaluate in a sandbox
const moduleObj = { exports: {} }
const fn = new Function('module', 'exports', 'require', compiled)
fn(moduleObj, moduleObj.exports, require)

const { INDUSTRY_DATA, INDUSTRY_NAMES, getIndustryInfo, findIndustry } = moduleObj.exports

const REQUIRED_FIELDS = [
  'overview', 'importance', 'upstream', 'midstream', 'downstream',
  'domesticStatus', 'overseasStatus', 'domesticCompanies',
  'overseasCompanies', 'sourceUrl',
]

const ARRAY_FIELDS = ['upstream', 'midstream', 'downstream', 'domesticCompanies', 'overseasCompanies']

let errors = []
let warnings = []
const names = Object.keys(INDUSTRY_DATA)

console.log(`Total industries: ${names.length}`)

// 1. Check minimum count
if (names.length < 25) {
  errors.push(`Expected at least 25 industries, got ${names.length}`)
}

// 2. Check every industry has all required fields with correct types
for (const name of names) {
  const info = INDUSTRY_DATA[name]
  for (const field of REQUIRED_FIELDS) {
    if (!(field in info)) {
      errors.push(`[${name}] Missing field: ${field}`)
      continue
    }
    const val = info[field]
    if (ARRAY_FIELDS.includes(field)) {
      if (!Array.isArray(val)) {
        errors.push(`[${name}] Field ${field} should be array, got ${typeof val}`)
      } else if (val.length < 3) {
        warnings.push(`[${name}] Field ${field} has only ${val.length} items`)
      } else if (val.some(v => typeof v !== 'string')) {
        errors.push(`[${name}] Field ${field} contains non-string elements`)
      }
    } else {
      if (typeof val !== 'string') {
        errors.push(`[${name}] Field ${field} should be string, got ${typeof val}`)
      } else if (val.length < 20) {
        warnings.push(`[${name}] Field ${field} is suspiciously short (${val.length} chars)`)
      }
    }
  }
  if (info.sourceUrl && !info.sourceUrl.includes('eastmoney.com')) {
    warnings.push(`[${name}] sourceUrl not eastmoney: ${info.sourceUrl}`)
  }
}

// 3. Check INDUSTRY_NAMES matches keys
if (!INDUSTRY_NAMES) {
  errors.push('INDUSTRY_NAMES is undefined')
} else if (INDUSTRY_NAMES.length !== names.length) {
  errors.push(`INDUSTRY_NAMES length (${INDUSTRY_NAMES.length}) != keys (${names.length})`)
}

// 4. Test getIndustryInfo
const testInfo = getIndustryInfo('半导体')
if (!testInfo || !testInfo.overview) {
  errors.push('getIndustryInfo("半导体") returned invalid result')
}

// 5. Test findIndustry
if (!findIndustry || findIndustry('半导体') !== INDUSTRY_DATA['半导体']) {
  errors.push('findIndustry exact match failed')
}
if (!findIndustry('半导体板块')) {
  errors.push('findIndustry fuzzy match failed')
}
if (findIndustry('不存在行业xyz') !== undefined) {
  errors.push('findIndustry should return undefined for unknown')
}

// Report
console.log(`\n--- Validation Results ---`)
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)

if (errors.length > 0) {
  console.log('\nERRORS:')
  errors.forEach(e => console.log(`  X ${e}`))
}
if (warnings.length > 0) {
  console.log('\nWARNINGS:')
  warnings.forEach(w => console.log(`  ! ${w}`))
}

// Sample output
console.log('\n--- Sample: 半导体 ---')
const s = INDUSTRY_DATA['半导体']
console.log(`  overview: ${s.overview.substring(0, 60)}...`)
console.log(`  upstream: ${s.upstream.length} items, midstream: ${s.midstream.length}, downstream: ${s.downstream.length}`)
console.log(`  domesticCompanies (${s.domesticCompanies.length}): ${s.domesticCompanies.slice(0,3).join(', ')}...`)
console.log(`  sourceUrl: ${s.sourceUrl}`)

console.log('\n--- All industry names ---')
console.log(names.join(', '))

if (errors.length === 0) {
  console.log('\n=== ALL CHECKS PASSED ===')
} else {
  console.log('\n=== VALIDATION FAILED ===')
}

// Cleanup temp files
try { fs.unlinkSync(path.join(projectDir, 'hermes-verify-industry-data.cjs')) } catch {}
try { fs.unlinkSync(path.join(projectDir, 'hermes-compiled.cjs')) } catch {}

process.exit(errors.length > 0 ? 1 : 0)
