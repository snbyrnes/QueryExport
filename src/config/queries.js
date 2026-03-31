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
        properties: [
          { code: '411116001', label: 'Dose Form' },
          { code: '680061000220102', label: 'MA Holder' }
        ],
        extraColumns: [],
        params: [
          {
            key: 'maholder',
            label: 'Manufacturing Holder',
            type: 'valueset-search',
            valuesetEcl: '< 774164004',
            placeholder: 'Type to search for a manufacturing holder…',
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
