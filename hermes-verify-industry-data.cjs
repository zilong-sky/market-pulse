// Ad-hoc verification script for industry-data.ts
// Compiles the TS to JS and validates structure at runtime
const ts = require('typescript')
const path = require('path')
const fs = require('fs')

const tsFile = path.join('E:', 'workspace', 'codex-ws', 'market-pulse', 'server', 'utils', 'industry-data.ts')
const source = fs.readFileSync(tsFile, 'utf-8')

// Transpile to CommonJS JS
const result = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
    esModuleInterop: true,
  },
  fileName: tsFile,
})

if (result.diagnostics && result.diagnostics.length > 0) {
  console.error('Transpile diagnostics:', result.diagnostics)
  process.exit(1)
}

// Evaluate the transpiled JS in a sandbox
const moduleObj = { exports: {} }
const fn = new Function('module', 'exports', result.outputText)
fn(moduleObj, moduleObj.exports)

const { INDUSTRY_DATA, INDUSTRY_NAMES, getIndustryInfo, findIndustry } = moduleObj.exports

const REQUIRED_FIELDS = [
  'overview', 'importance', 'upstream', 'midstream', 'downstream',
  'domesticStatus', 'overseasStatus', 'domesticCompanies',
  'overseasCompanies', 'sourceUrl',
]

let errors = []
let warnings = []
const names = Object.keys(INDUSTRY_DATA)

console.log(`Total industries: ${names.length}`)

// 1. Check every industry has all required fields with correct types
for (const name of names) {
  const info = INDUSTRY_DATA[name]
  for (const field of REQUIRED_FIELDS) {
    if (!(field in info)) {
      errors.push(`[${name}] Missing field: ${field}`)
      continue
    }
    const val = info[field]
    if (field.endsWith('upstream') || field.endsWith('midstream') || field.endsWith('downstream') ||
        field === 'domesticCompanies' || field === 'overseasCompanies') {
      if (!Array.isArray(val)) {
        errors.push(`[${name}] Field ${field} should be array, got ${typeof val}`)
      } else if (val.length < 3) {
        warnings.push(`[${name}] Field ${field} has only ${val.length} items (expected 3+)`)
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
  // Check sourceUrl is a valid eastmoney URL
  if (info.sourceUrl && !info.sourceUrl.includes('eastmoney.com')) {
    warnings.push(`[${name}] sourceUrl doesn't look like eastmoney: ${info.sourceUrl}`)
  }
}

// 2. Check INDUSTRY_NAMES matches keys
if (INDUSTRY_NAMES.length !== names.length) {
  errors.push(`INDUSTRY_NAMES length (${INDUSTRY_NAMES.length}) != INDUSTRY_DATA keys (${names.length})`)
} else {
  for (let i = 0; i < names.length; i++) {
    if (INDUSTRY_NAMES[i] !== names[i]) {
      errors.push(`INDUSTRY_NAMES[${i}] = "${INDUSTRY_NAMES[i]}" != "${names[i]}"`)
    }
  }
}

// 3. Test getIndustryInfo
const testInfo = getIndustryInfo('半导体')
if (!testInfo || !testInfo.overview) {
  errors.push('getIndustryInfo("半导体") returned invalid result')
}

// 4. Test findIndustry - exact match
if (findIndustry('半导体') !== INDUSTRY_DATA['半导体']) {
  errors.push('findIndustry exact match failed')
}

// 5. Test findIndustry - fuzzy match
if (!findIndustry('半导体板块')) {
  errors.push('findIndustry fuzzy match failed for "半导体板块"')
}

// 6. Test findIndustry - not found
if (findIndustry('不存在的行业') !== undefined) {
  errors.push('findIndustry should return undefined for unknown industry')
}

// Report
console.log(`\n--- Validation Results ---`)
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)

if (errors.length > 0) {
  console.log('\nERRORS:')
  errors.forEach(e => console.log(`  ✗ ${e}`))
}
if (warnings.length > 0) {
  console.log('\nWARNINGS:')
  warnings.forEach(w => console.log(`  ⚠ ${w}`))
}

// Print sample
console.log('\n--- Sample: 半导体 ---')
const sample = INDUSTRY_DATA['半导体']
console.log(`overview: ${sample.overview.substring(0, 50)}...`)
console.log(`upstream: ${sample.upstream.length} items`)
console.log(`midstream: ${sample.midstream.length} items`)
console.log(`downstream: ${sample.downstream.length} items`)
console.log(`domesticCompanies: ${sample.domesticCompanies.join(', ')}`)
console.log(`sourceUrl: ${sample.sourceUrl}`)

if (errors.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED')
  process.exit(0)
} else {
  console.log('\n❌ VALIDATION FAILED')
  process.exit(1)
}
