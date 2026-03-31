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

export function buildExpandUrl(ecl, properties = []) {
  const url = `http://snomed.info/sct?fhir_vs=ecl/${ecl}`
  let expandUrl = `${API_BASE_URL}/ValueSet/$expand?url=${encodeURIComponent(url)}`
  for (const prop of properties) {
    expandUrl += `&property=${encodeURIComponent(prop.code)}`
  }
  return expandUrl
}

export function buildSearchUrl(ecl, filter) {
  const url = `http://snomed.info/sct?fhir_vs=ecl/${ecl}`
  return `${API_BASE_URL}/ValueSet/$expand?url=${encodeURIComponent(url)}&filter=${encodeURIComponent(filter)}&count=20`
}

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
        id: 'industry-ampps-by-maholder',
        name: 'AMPPs by MA Holder (all properties)',
        description: 'Find all AMPPs (Actual Medicinal Product Packs) for a manufacturing authorisation holder, returning all properties and subproperties.',
        ecl: '^ 660361000220103 : 680061000220102 = {{maholder}}',
        properties: [
          { code: '*', label: '__all__' }
        ],
        extraColumns: [],
        params: [
          {
            key: 'maholder',
            label: 'MA Holder',
            type: 'valueset-search',
            valuesetEcl: '< 774164004',
            placeholder: 'Type to search for a manufacturing holder…',
            required: true
          }
        ]
      }
    ]
  }
]
