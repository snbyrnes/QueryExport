/**
 * FHIR Query Configuration
 *
 * Each query uses FHIR ValueSet/$expand with ECL (Expression Constraint Language).
 * Queries can have parameters that are substituted into the ECL template.
 * Parameters of type 'valueset-search' provide a typeahead backed by a ValueSet lookup.
 */

export const FHIR_SERVER_URL = 'https://nmpc.hse.ie/production1/fhir'
export const TOKEN_SERVER_URL = 'https://nmpc.hse.ie/authorisation/auth/realms/terminology/protocol/openid-connect/token'

// In dev, requests go through Vite proxy to avoid CORS. In production, direct.
export const API_BASE_URL = import.meta.env.DEV ? '/fhir-api' : FHIR_SERVER_URL
export const TOKEN_URL = import.meta.env.DEV
  ? '/auth-api/realms/terminology/protocol/openid-connect/token'
  : TOKEN_SERVER_URL

/**
 * Build the FHIR ValueSet/$expand URL for an ECL expression.
 * @param {string} ecl - The ECL expression (already substituted with param values)
 * @returns {string} The full URL path for ValueSet/$expand
 */
export function buildExpandUrl(ecl, properties = []) {
  const url = `http://snomed.info/sct?fhir_vs=ecl/${ecl}`
  let expandUrl = `${API_BASE_URL}/ValueSet/$expand?url=${encodeURIComponent(url)}`
  for (const prop of properties) {
    expandUrl += `&property=${encodeURIComponent(prop.code)}`
  }
  return expandUrl
}

/**
 * Build the FHIR ValueSet/$expand URL for a typeahead search.
 * @param {string} ecl - The ECL constraint for the valueset
 * @param {string} filter - The user's search text
 * @returns {string} The full URL path for ValueSet/$expand with filter
 */
export function buildSearchUrl(ecl, filter) {
  const url = `http://snomed.info/sct?fhir_vs=ecl/${ecl}`
  return `${API_BASE_URL}/ValueSet/$expand?url=${encodeURIComponent(url)}&filter=${encodeURIComponent(filter)}&count=20`
}

/**
 * Build the FHIR CodeSystem/$lookup URL for a single concept.
 * @param {string} code - The SNOMED CT code to look up
 * @returns {string} The full URL path for CodeSystem/$lookup
 */
export function buildLookupUrl(code) {
  return `${API_BASE_URL}/CodeSystem/$lookup?system=${encodeURIComponent('http://snomed.info/sct')}&code=${encodeURIComponent(code)}&property=*&property=609096000`
}

export const queryGroups = [
  {
    id: 'industry',
    name: 'Industry',
    icon: '🏭',
    description: 'Industry-related queries and lookups',
    queries: [
      {
        id: 'industry-ampps-by-supplier',
        name: 'AMPPs by Supplier',
        description: 'Find all AMPPs (Actual Medicinal Product Packs) for a specific supplier',
        ecl: '^ 660401000220107 : 680061000220102 = {{supplier}}',
        properties: [
          { code: '411116001', label: 'Dose Form' },
          { code: '680061000220102', label: 'MA Holder' }
        ],
        extraColumns: [],
        params: [
          {
            key: 'supplier',
            label: 'Supplier',
            type: 'valueset-search',
            valuesetEcl: '< 774164004',
            placeholder: 'Type to search for a supplier…',
            required: true
          }
        ]
      },
      {
        id: 'industry-amps-by-supplier',
        name: 'AMPs by Supplier',
        description: 'Find all AMPs (Actual Medicinal Products) for a specific supplier',
        ecl: '^ 659161000220101 : 680061000220102 = {{supplier}}',
        properties: [
          { code: '411116001', label: 'Dose Form' },
          { code: '680061000220102', label: 'MA Holder' }
        ],
        extraColumns: [],
        params: [
          {
            key: 'supplier',
            label: 'Supplier',
            type: 'valueset-search',
            valuesetEcl: '< 774164004',
            placeholder: 'Type to search for a supplier…',
            required: true
          }
        ]
      },
      {
        id: 'industry-concept-lookup',
        name: 'Concept Property Lookup',
        description: 'Look up all properties for a given SNOMED CT code',
        type: 'lookup',
        params: [
          {
            key: 'code',
            label: 'SNOMED CT Code',
            type: 'text',
            placeholder: 'Enter a SNOMED CT code, e.g. 621391000220109',
            required: true
          }
        ]
      },
      { id: 'industry-4', name: 'Query 4', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'industry-5', name: 'Query 5', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'industry-6', name: 'Query 6', description: 'Placeholder query', ecl: '', params: [] }
    ]
  },
  {
    id: 'quality',
    name: 'Quality',
    icon: '✅',
    description: 'Quality assurance and control queries',
    queries: [
      { id: 'quality-1', name: 'Query 1', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'quality-2', name: 'Query 2', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'quality-3', name: 'Query 3', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'quality-4', name: 'Query 4', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'quality-5', name: 'Query 5', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'quality-6', name: 'Query 6', description: 'Placeholder query', ecl: '', params: [] }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    icon: '📝',
    description: 'Content management and review queries',
    queries: [
      { id: 'content-1', name: 'Query 1', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'content-2', name: 'Query 2', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'content-3', name: 'Query 3', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'content-4', name: 'Query 4', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'content-5', name: 'Query 5', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'content-6', name: 'Query 6', description: 'Placeholder query', ecl: '', params: [] }
    ]
  },
  {
    id: 'hold1',
    name: 'Hold',
    icon: '⏸️',
    description: 'Hold group — reserved for future queries',
    queries: [
      { id: 'hold1-1', name: 'Query 1', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold1-2', name: 'Query 2', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold1-3', name: 'Query 3', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold1-4', name: 'Query 4', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold1-5', name: 'Query 5', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold1-6', name: 'Query 6', description: 'Placeholder query', ecl: '', params: [] }
    ]
  },
  {
    id: 'hold2',
    name: 'Hold',
    icon: '⏸️',
    description: 'Hold group — reserved for future queries',
    queries: [
      { id: 'hold2-1', name: 'Query 1', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold2-2', name: 'Query 2', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold2-3', name: 'Query 3', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold2-4', name: 'Query 4', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold2-5', name: 'Query 5', description: 'Placeholder query', ecl: '', params: [] },
      { id: 'hold2-6', name: 'Query 6', description: 'Placeholder query', ecl: '', params: [] }
    ]
  }
]
