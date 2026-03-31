<template>
  <div class="dashboard">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span v-if="!sidebarCollapsed" class="brand">⚡ QueryExport</span>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand' : 'Collapse'">
          {{ sidebarCollapsed ? '☰' : '✕' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="group in queryGroups"
          :key="group.id"
          class="nav-group"
        >
          <button
            class="nav-group-header"
            :class="{ active: activeGroup === group.id }"
            @click="toggleGroup(group.id)"
          >
            <span class="group-icon">{{ group.icon }}</span>
            <span v-if="!sidebarCollapsed" class="group-name">{{ group.name }}</span>
            <span v-if="!sidebarCollapsed" class="chevron" :class="{ open: expandedGroups.has(group.id) }">›</span>
          </button>
          <transition name="slide">
            <ul v-if="expandedGroups.has(group.id) && !sidebarCollapsed" class="query-list">
              <li
                v-for="query in group.queries"
                :key="query.id"
                class="query-item"
                :class="{ selected: selectedQuery?.id === query.id }"
                @click="selectQuery(group, query)"
              >
                {{ query.name }}
              </li>
            </ul>
          </transition>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout" :title="sidebarCollapsed ? 'Logout' : ''">
          <span>🔒</span>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="top-bar">
        <div class="breadcrumb">
          <span v-if="activeGroupData">{{ activeGroupData.icon }} {{ activeGroupData.name }}</span>
          <span v-if="selectedQuery" class="crumb-sep">/</span>
          <span v-if="selectedQuery" class="crumb-query">{{ selectedQuery.name }}</span>
        </div>
        <div class="top-bar-actions">
          <span v-if="hasCredentials" class="cred-status connected" title="API credentials configured">● Connected</span>
          <span v-else class="cred-status disconnected" title="No API credentials">● No credentials</span>
          <button class="settings-btn" @click="showSettings = true" title="API Settings">
            ⚙️
          </button>
        </div>
      </header>

      <!-- Settings Modal -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
            <div class="modal-card">
              <div class="modal-header">
                <h3>API Settings</h3>
                <button class="modal-close" @click="showSettings = false">✕</button>
              </div>
              <div class="modal-body">
                <div class="api-info-box">
                  <div class="api-info-row">
                    <span class="api-info-label">FHIR Server</span>
                    <code class="api-info-value">{{ FHIR_SERVER_URL }}</code>
                  </div>
                  <div class="api-info-row">
                    <span class="api-info-label">Auth</span>
                    <span class="api-info-value">OAuth2 Client Credentials</span>
                  </div>
                  <div class="api-info-row">
                    <span class="api-info-label">Token Endpoint</span>
                    <code class="api-info-value">{{ TOKEN_SERVER_URL }}</code>
                  </div>
                  <div class="api-info-row">
                    <span class="api-info-label">Status</span>
                    <span v-if="connectionStatus === 'connected'" class="api-info-value status-ok">● Connected</span>
                    <span v-else-if="connectionStatus === 'error'" class="api-info-value status-err">● Connection failed</span>
                    <span v-else-if="connectionStatus === 'testing'" class="api-info-value status-testing">○ Connecting…</span>
                    <span v-else class="api-info-value status-none">○ Not connected</span>
                  </div>
                </div>

                <div v-if="connectionDetails" class="connection-details">
                  <div v-for="(val, key) in connectionDetails" :key="key" class="conn-detail-row">
                    <span class="conn-detail-label">{{ key }}</span>
                    <span class="conn-detail-value">{{ val }}</span>
                  </div>
                </div>
                <div v-if="connectionError" class="conn-error">{{ connectionError }}</div>

                <p class="modal-desc">Enter your OAuth2 client credentials. The app will exchange these for a bearer token. Credentials are stored in your browser session only.</p>
                <div class="modal-field">
                  <label for="s-token">Client ID</label>
                  <input id="s-token" v-model="tokenInput" type="text" placeholder="Enter your client ID" autocomplete="off" />
                </div>
                <div class="modal-field">
                  <label for="s-secret">Client Secret</label>
                  <input id="s-secret" v-model="secretInput" type="password" placeholder="Enter your client secret" autocomplete="off" />
                </div>
              </div>
              <div class="modal-footer">
                <button class="modal-btn cancel" @click="showSettings = false">Cancel</button>
                <button class="modal-btn test" @click="testConnection" :disabled="!tokenInput.trim() || !secretInput.trim() || connectionStatus === 'testing'">Test</button>
                <button class="modal-btn save" @click="saveCredentials" :disabled="!tokenInput.trim() || !secretInput.trim()">Save</button>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Empty State -->
      <div v-if="!selectedQuery" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Select a Query</h2>
        <p>Choose a query from the sidebar to get started. Results can be viewed and exported.</p>
        <div class="group-cards">
          <div
            v-for="group in queryGroups"
            :key="group.id"
            class="group-card"
            @click="toggleGroup(group.id); sidebarCollapsed = false"
          >
            <span class="card-icon">{{ group.icon }}</span>
            <h3>{{ group.name }}</h3>
            <p>{{ group.queries.length }} queries</p>
          </div>
        </div>
      </div>

      <!-- Query Panel -->
      <div v-else class="query-panel">
        <div class="query-header">
          <div>
            <h2>{{ selectedQuery.name }}</h2>
            <p class="query-desc">{{ selectedQuery.description }}</p>
          </div>
          <div v-if="selectedQuery.ecl" class="query-meta">
            <span class="method-badge get">FHIR</span>
            <code class="endpoint">ValueSet/$expand</code>
          </div>
          <div v-else-if="selectedQuery.type === 'lookup'" class="query-meta">
            <span class="method-badge get">FHIR</span>
            <code class="endpoint">CodeSystem/$lookup</code>
          </div>
          <div v-else class="query-meta">
            <span class="method-badge placeholder-badge">Placeholder</span>
          </div>
        </div>

        <!-- ECL Preview -->
        <div v-if="selectedQuery.ecl" class="ecl-preview">
          <span class="ecl-label">ECL</span>
          <code class="ecl-code">{{ selectedQuery.ecl }}</code>
        </div>

        <!-- Parameters -->
        <div v-if="visibleParams.length > 0" class="params-section">
          <h3>Parameters</h3>
          <div class="params-grid">
            <div v-for="param in visibleParams" :key="param.key" class="param-field">
              <label :for="'p-' + param.key">
                {{ param.label }}
                <span v-if="param.required" class="required">*</span>
              </label>

              <!-- Valueset search (typeahead) -->
              <div v-if="param.type === 'valueset-search'" class="typeahead-wrap">
                <input
                  :id="'p-' + param.key"
                  v-model="paramValues[param.key]"
                  type="text"
                  :placeholder="param.placeholder || 'Type to search…'"
                  autocomplete="off"
                  @input="onTypeaheadInput(param)"
                  @focus="typeaheadOpen[param.key] && (typeaheadResults[param.key]?.length > 0)"
                  @blur="closeTypeahead(param.key)"
                />
                <span v-if="typeaheadLoading[param.key]" class="ta-spinner"></span>
                <span v-if="paramSelections[param.key]" class="ta-selected" :title="paramSelections[param.key].code">
                  ✓ {{ paramSelections[param.key].code }}
                </span>
                <ul v-if="typeaheadOpen[param.key] && typeaheadResults[param.key]?.length > 0" class="typeahead-dropdown">
                  <li
                    v-for="item in typeaheadResults[param.key]"
                    :key="item.code"
                    class="ta-item"
                    @mousedown.prevent="selectTypeaheadItem(param, item)"
                  >
                    <span class="ta-display">{{ item.display }}</span>
                    <span class="ta-code">{{ item.code }}</span>
                  </li>
                </ul>
                <div v-if="typeaheadOpen[param.key] && !typeaheadLoading[param.key] && typeaheadResults[param.key]?.length === 0 && paramValues[param.key]?.length >= 2" class="typeahead-dropdown ta-empty">
                  No results found
                </div>
              </div>

              <!-- Standard text/number/date input -->
              <input
                v-else
                :id="'p-' + param.key"
                v-model="paramValues[param.key]"
                :type="param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'"
                :placeholder="param.placeholder || param.label"
              />
            </div>
          </div>
        </div>

        <!-- Placeholder notice -->
        <div v-if="!selectedQuery.ecl && selectedQuery.type !== 'lookup'" class="placeholder-notice">
          <span>📋</span> This query is a placeholder and not yet configured.
        </div>

        <!-- Run Button -->
        <div v-if="selectedQuery.ecl || selectedQuery.type === 'lookup'" class="run-bar">
          <button class="run-btn" @click="runQuery" :disabled="loading || !canRun">
            <span v-if="loading" class="spinner"></span>
            <span v-else>▶</span>
            {{ loading ? 'Running...' : 'Run Query' }}
          </button>
          <span v-if="lastRunTime" class="run-time">Completed in {{ lastRunTime }}ms</span>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-banner">
          <span>⚠️</span> {{ error }}
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="results-section">
          <div class="results-toolbar">
            <span class="result-count">{{ results.length }} record{{ results.length !== 1 ? 's' : '' }}<span v-if="resultTotal !== null && resultTotal !== results.length"> ({{ resultTotal }} total)</span></span>
            <div class="export-btns">
              <button @click="exportCSV" class="export-btn csv">📄 CSV</button>
              <button @click="exportExcel" class="export-btn excel">📊 Excel</button>
              <button @click="exportJSON" class="export-btn json">{ } JSON</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="col in columns" :key="col" @click="sortBy(col)" class="sortable">
                    {{ col }}
                    <span v-if="sortColumn === col" class="sort-arrow">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sortedResults" :key="idx">
                  <td v-for="col in columns" :key="col">{{ formatCell(row[col]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- No Results -->
        <div v-if="hasRun && results.length === 0 && !loading && !error" class="no-results">
          <span>📭</span> No results found.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { queryGroups, API_BASE_URL, FHIR_SERVER_URL, TOKEN_URL, TOKEN_SERVER_URL, buildExpandUrl, buildSearchUrl, buildLookupUrl } from '../config/queries.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const router = useRouter()

// Sidebar state
const sidebarCollapsed = ref(false)
const expandedGroups = ref(new Set())
const activeGroup = ref(null)
const selectedQuery = ref(null)

// Settings modal state
const showSettings = ref(false)
const tokenInput = ref('')
const secretInput = ref('')
const clientId = ref('')
const clientSecret = ref('')
const accessToken = ref('')
const connectionStatus = ref('') // '', 'testing', 'connected', 'error'
const connectionDetails = ref(null)
const connectionError = ref('')

const hasCredentials = computed(() => accessToken.value && connectionStatus.value === 'connected')

onMounted(() => {
  clientId.value = sessionStorage.getItem('qe_client_id') || ''
  clientSecret.value = sessionStorage.getItem('qe_client_secret') || ''
  accessToken.value = sessionStorage.getItem('qe_access_token') || ''
  tokenInput.value = clientId.value
  secretInput.value = clientSecret.value
  if (accessToken.value) {
    connectionStatus.value = 'connected'
    verifyConnection()
  } else if (clientId.value && clientSecret.value) {
    testConnection()
  }
})

async function getAccessToken(cId, cSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cId,
    client_secret: cSecret
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Authentication failed (${res.status}). ${text}`)
  }

  const data = await res.json()
  if (data.access_token) return data.access_token
  throw new Error('No access_token in response')
}

async function testConnection() {
  connectionStatus.value = 'testing'
  connectionDetails.value = null
  connectionError.value = ''

  try {
    const token = await getAccessToken(tokenInput.value.trim(), secretInput.value.trim())
    accessToken.value = token
    sessionStorage.setItem('qe_access_token', token)

    await verifyConnection()
  } catch (err) {
    connectionStatus.value = 'error'
    connectionError.value = err.message || 'Failed to authenticate'
    connectionDetails.value = null
    accessToken.value = ''
    sessionStorage.removeItem('qe_access_token')
  }
}

async function verifyConnection() {
  try {
    const res = await fetch(API_BASE_URL + '/metadata', {
      headers: {
        'Accept': 'application/fhir+json, application/json',
        'Authorization': `Bearer ${accessToken.value}`
      }
    })

    if (!res.ok) {
      // Token may have expired, clear it
      if (res.status === 401) {
        accessToken.value = ''
        sessionStorage.removeItem('qe_access_token')
        connectionStatus.value = ''
        connectionError.value = 'Token expired. Please reconnect.'
        return
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    const details = {}

    if (data.resourceType) details['Resource Type'] = data.resourceType
    if (data.fhirVersion) details['FHIR Version'] = data.fhirVersion
    if (data.software?.name) details['Server'] = data.software.name
    if (data.software?.version) details['Server Version'] = data.software.version
    if (data.implementation?.description) details['Implementation'] = data.implementation.description
    if (data.implementation?.url) details['URL'] = data.implementation.url
    if (data.status) details['Status'] = data.status
    if (data.publisher) details['Publisher'] = data.publisher
    if (data.rest?.[0]?.resource) details['Resource Types'] = data.rest[0].resource.length + ' available'

    if (Object.keys(details).length === 0) {
      details['Response'] = 'Server responded successfully'
    }

    connectionDetails.value = details
    connectionStatus.value = 'connected'
  } catch (err) {
    connectionStatus.value = 'error'
    connectionError.value = err.message || 'Failed to connect'
    connectionDetails.value = null
  }
}

function saveCredentials() {
  clientId.value = tokenInput.value.trim()
  clientSecret.value = secretInput.value.trim()
  sessionStorage.setItem('qe_client_id', clientId.value)
  sessionStorage.setItem('qe_client_secret', clientSecret.value)
  if (connectionStatus.value !== 'connected') {
    testConnection()
  }
  showSettings.value = false
}

// Query execution state
const paramValues = reactive({})
const paramSelections = reactive({}) // stores the full selected concept { code, display }
const loading = ref(false)
const error = ref('')
const results = ref([])
const hasRun = ref(false)
const lastRunTime = ref(null)
const resultTotal = ref(null)

// Typeahead state
const typeaheadResults = reactive({}) // key → array of { code, display, system }
const typeaheadLoading = reactive({})
const typeaheadOpen = reactive({})
let typeaheadTimers = {}

// Sort state
const sortColumn = ref('')
const sortDirection = ref('asc')

const activeGroupData = computed(() => queryGroups.find(g => g.id === activeGroup.value))

const visibleParams = computed(() => {
  if (!selectedQuery.value) return []
  return selectedQuery.value.params || []
})

const canRun = computed(() => {
  if (!selectedQuery.value) return false
  const q = selectedQuery.value
  if (!q.ecl && q.type !== 'lookup') return false
  return (q.params || [])
    .filter(p => p.required)
    .every(p => {
      if (p.type === 'valueset-search') return paramSelections[p.key]?.code
      return paramValues[p.key]?.toString().trim()
    })
})

const columns = computed(() => {
  if (results.value.length === 0) return []
  return Object.keys(results.value[0])
})

const sortedResults = computed(() => {
  if (!sortColumn.value) return results.value
  return [...results.value].sort((a, b) => {
    const aVal = a[sortColumn.value]
    const bVal = b[sortColumn.value]
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal))
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
})

function toggleGroup(groupId) {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
  activeGroup.value = groupId
}

function selectQuery(group, query) {
  activeGroup.value = group.id
  selectedQuery.value = query
  error.value = ''
  results.value = []
  hasRun.value = false
  lastRunTime.value = null
  resultTotal.value = null
  sortColumn.value = ''

  // Reset param values
  Object.keys(paramValues).forEach(k => delete paramValues[k])
  Object.keys(paramSelections).forEach(k => delete paramSelections[k])
  Object.keys(typeaheadResults).forEach(k => delete typeaheadResults[k])
  Object.keys(typeaheadLoading).forEach(k => delete typeaheadLoading[k])
  Object.keys(typeaheadOpen).forEach(k => delete typeaheadOpen[k])
  ;(query.params || []).forEach(p => {
    paramValues[p.key] = ''
  })
}

function onTypeaheadInput(param) {
  const key = param.key
  const filter = paramValues[key]?.trim()

  // Clear previous selection when typing
  delete paramSelections[key]

  // Clear previous timer
  if (typeaheadTimers[key]) clearTimeout(typeaheadTimers[key])

  if (!filter || filter.length < 2) {
    typeaheadResults[key] = []
    typeaheadOpen[key] = false
    return
  }

  typeaheadLoading[key] = true
  typeaheadOpen[key] = true

  // Debounce 300ms
  typeaheadTimers[key] = setTimeout(async () => {
    try {
      const url = buildSearchUrl(param.valuesetEcl, filter)
      const fetchOpts = {
        headers: { 'Accept': 'application/fhir+json' }
      }
      if (accessToken.value) {
        fetchOpts.headers['Authorization'] = `Bearer ${accessToken.value}`
      }
      const res = await fetch(url, fetchOpts)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      typeaheadResults[key] = (data.expansion?.contains || []).map(c => ({
        code: c.code,
        display: c.display || c.code,
        system: c.system || ''
      }))
    } catch (err) {
      typeaheadResults[key] = []
    } finally {
      typeaheadLoading[key] = false
    }
  }, 300)
}

function selectTypeaheadItem(param, item) {
  paramSelections[param.key] = item
  paramValues[param.key] = item.display
  typeaheadOpen[param.key] = false
}

function closeTypeahead(key) {
  // Delay to allow click on item to register
  setTimeout(() => { typeaheadOpen[key] = false }, 200)
}

async function refreshTokenIfNeeded() {
  // Try to get a fresh token using stored credentials
  if (clientId.value && clientSecret.value) {
    try {
      const token = await getAccessToken(clientId.value, clientSecret.value)
      accessToken.value = token
      sessionStorage.setItem('qe_access_token', token)
      connectionStatus.value = 'connected'
      return true
    } catch (_) {}
  }
  return false
}

/**
 * Extract the dose form from a SNOMED CT drug display string.
 * e.g. "Abrocitinib 100 mg oral tablet (28 tablets)" → "oral tablet"
 *      "Besponsa 1 mg powder for solution for infusion vial (1 vials)" → "powder for solution for infusion vial"
 */
function parseDoseForm(display) {
  if (!display) return ''
  const m = display.match(
    /\b\d+(?:[.,]\d+)?\s*(?:mg|g|ml|mL|mcg|microgram|%|units?|IU|mmol)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|g|ml|mL|mcg|microgram|%|units?|IU|mmol))?\s+(.+?)(?:\s*\(|$)/i
  )
  return m ? m[1].trim() : ''
}

async function runQuery() {
  if (!selectedQuery.value) return
  const isLookup = selectedQuery.value.type === 'lookup'
  if (!isLookup && !selectedQuery.value.ecl) return
  loading.value = true
  error.value = ''
  results.value = []
  hasRun.value = true
  lastRunTime.value = null
  resultTotal.value = null

  const start = performance.now()

  try {
    if (!accessToken.value) {
      throw new Error('No API credentials. Open Settings to configure.')
    }

    const fetchOpts = {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Authorization': `Bearer ${accessToken.value}`
      }
    }

    if (isLookup) {
      // CodeSystem/$lookup for a single concept
      const code = paramValues['code']?.trim()
      if (!code) throw new Error('Please enter a SNOMED CT code.')

      const fetchUrl = buildLookupUrl(code)
      let res = await fetch(fetchUrl, fetchOpts)

      if (res.status === 401) {
        const refreshed = await refreshTokenIfNeeded()
        if (refreshed) {
          fetchOpts.headers['Authorization'] = `Bearer ${accessToken.value}`
          res = await fetch(fetchUrl, fetchOpts)
        }
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${res.statusText}. ${body}`)
      }

      const data = await res.json()
      const params = data.parameter || []

      // Parse the Parameters response into table rows
      const rows = []
      for (const p of params) {
        if (p.name === 'property') {
          // Compound property — extract parts
          const parts = p.part || []
          const codeVal = parts.find(pp => pp.name === 'code')
          const descVal = parts.find(pp => pp.name === 'description')
          const valueEntry = parts.find(pp => pp.name === 'value' || pp.name === 'subproperty')
          let value = ''
          if (valueEntry) {
            value = valueEntry.valueCoding?.display
              ? `${valueEntry.valueCoding.display} (${valueEntry.valueCoding.code})`
              : valueEntry.valueString || valueEntry.valueCode || valueEntry.valueBoolean?.toString() || valueEntry.valueInteger?.toString() || valueEntry.valueDateTime || ''
          }
          rows.push({
            Property: codeVal?.valueCode || '',
            Description: descVal?.valueString || '',
            Value: value
          })
        } else {
          // Top-level parameter (code, display, name, version, etc.)
          const value = p.valueString || p.valueCode || p.valueBoolean?.toString() || p.valueUri || ''
          rows.push({
            Property: p.name || '',
            Description: '',
            Value: value
          })
        }
      }

      results.value = rows
      resultTotal.value = rows.length

    } else {
      // ECL-based ValueSet/$expand query
      let ecl = selectedQuery.value.ecl
      for (const param of selectedQuery.value.params || []) {
        const placeholder = `{{${param.key}}}`
        if (ecl.includes(placeholder)) {
          if (param.type === 'valueset-search') {
            const sel = paramSelections[param.key]
            if (!sel?.code) throw new Error(`Please select a ${param.label} from the search results.`)
            ecl = ecl.replace(placeholder, sel.code)
          } else {
            ecl = ecl.replace(placeholder, paramValues[param.key] || '')
          }
        }
      }

      const queryProps = selectedQuery.value.properties || []
      const extraColumns = selectedQuery.value.extraColumns || []

      const fetchUrl = buildExpandUrl(ecl, queryProps)
      let res = await fetch(fetchUrl, fetchOpts)

      // If 401, try refreshing the token once
      if (res.status === 401) {
        const refreshed = await refreshTokenIfNeeded()
        if (refreshed) {
          fetchOpts.headers['Authorization'] = `Bearer ${accessToken.value}`
          res = await fetch(fetchUrl, fetchOpts)
        }
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${res.statusText}. ${body}`)
      }

      const data = await res.json()

      // Parse FHIR ValueSet expansion response
      const contains = data.expansion?.contains || []
      resultTotal.value = data.expansion?.total ?? contains.length

      results.value = contains.map(c => {
        const row = {
          Code: c.code || '',
          Display: c.display || ''
        }

        const hasWildcard = queryProps.some(qp => qp.code === '*')

        if (hasWildcard) {
          // property=* returns all properties — dynamically add them
          for (const prop of (c.property || [])) {
            const label = prop.code || 'unknown'
            const val = prop.valueCoding?.display
              ? `${prop.valueCoding.display} (${prop.valueCoding.code})`
              : prop.valueString || prop.valueCode || prop.valueBoolean?.toString() || prop.valueInteger?.toString() || prop.valueDateTime || ''
            // If same property appears multiple times, append
            if (row[label] && row[label] !== val) {
              row[label] += '; ' + val
            } else {
              row[label] = val
            }
          }
        } else {
          // Named properties only
          for (const qp of queryProps) {
            const prop = (c.property || []).find(p => p.code === qp.code)
            if (prop) {
              row[qp.label] = prop.valueCoding?.display || prop.valueString || prop.valueCode || ''
            } else {
              row[qp.label] = ''
            }
          }
        }

        // Extra derived columns
        for (const ec of extraColumns) {
          if (ec.source === 'parse-dose-form') {
            row[ec.label] = parseDoseForm(c.display || '')
          } else if (ec.source === 'param') {
            const sel = paramSelections[ec.paramKey]
            row[ec.label] = sel?.display || paramValues[ec.paramKey] || ''
          }
        }

        row.System = c.system || ''
        return row
      })
    }

    lastRunTime.value = Math.round(performance.now() - start)
  } catch (err) {
    error.value = err.message || 'An error occurred while running the query.'
  } finally {
    loading.value = false
  }
}

function sortBy(col) {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDirection.value = 'asc'
  }
}

function formatCell(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

function getExportFilename() {
  return `${selectedQuery.value?.name?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().slice(0, 10)}`
}

function exportCSV() {
  const ws = XLSX.utils.json_to_sheet(sortedResults.value)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, getExportFilename() + '.csv')
}

function exportExcel() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sortedResults.value)
  XLSX.utils.book_append_sheet(wb, ws, 'Results')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  saveAs(blob, getExportFilename() + '.xlsx')
}

function exportJSON() {
  const json = JSON.stringify(sortedResults.value, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  saveAs(blob, getExportFilename() + '.json')
}

function logout() {
  sessionStorage.removeItem('qe_authenticated')
  router.push('/')
}
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background: #f8fafc;
  color: #334155;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
  color: #1e293b;
}

.toggle-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
}

.toggle-btn:hover {
  color: #1e293b;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #475569;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.nav-group-header:hover, .nav-group-header.active {
  background: #eff6ff;
  color: #1e293b;
}

.group-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.group-name {
  flex: 1;
  white-space: nowrap;
}

.chevron {
  transition: transform 0.2s;
  font-size: 1.1rem;
}

.chevron.open {
  transform: rotate(90deg);
}

.query-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.query-item {
  padding: 0.5rem 1rem 0.5rem 2.75rem;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.query-item:hover {
  background: #f1f5f9;
  color: #334155;
}

.query-item.selected {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 500;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}

.logout-btn:hover {
  background: #fee2e2;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  min-width: 0;
}

.top-bar {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cred-status {
  font-size: 0.75rem;
  font-weight: 500;
}

.cred-status.connected {
  color: #16a34a;
}

.cred-status.disconnected {
  color: #dc2626;
}

.settings-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
  font-size: 1.15rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  line-height: 1;
}

.settings-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.breadcrumb {
  font-size: 0.9rem;
  color: #64748b;
}

.crumb-sep {
  margin: 0 0.5rem;
  color: #cbd5e1;
}

.crumb-query {
  color: #1e293b;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h2 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
  color: #1e293b;
}

.empty-state > p {
  color: #64748b;
  max-width: 400px;
  text-align: center;
  margin: 0 0 2rem;
}

.group-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  padding: 0 1rem;
}

.group-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  text-align: center;
}

.group-card:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.group-card h3 {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  color: #1e293b;
}

.group-card p {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Query Panel */
.query-panel {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.query-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
  color: #1e293b;
}

.query-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.query-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.method-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.method-badge.get { background: #dcfce7; color: #16a34a; }
.method-badge.post { background: #dbeafe; color: #2563eb; }
.method-badge.put { background: #fef9c3; color: #ca8a04; }
.method-badge.delete { background: #fee2e2; color: #dc2626; }
.method-badge.placeholder-badge { background: #f1f5f9; color: #94a3b8; }

.endpoint {
  font-size: 0.8rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.6rem;
  border-radius: 0.35rem;
}

/* Params */
.params-section {
  margin-bottom: 1.5rem;
}

.params-section h3 {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.param-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.35rem;
}

.required {
  color: #dc2626;
}

.param-field input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.param-field input:focus {
  border-color: #3b82f6;
}

/* Run Bar */
.run-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.run-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.run-btn:hover:not(:disabled) {
  background: #2563eb;
}

.run-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.run-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Error */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

/* Results */
.results-section {
  margin-top: 0.5rem;
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.result-count {
  font-size: 0.85rem;
  color: #64748b;
}

.export-btns {
  display: flex;
  gap: 0.5rem;
}

.export-btn {
  padding: 0.45rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.export-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  user-select: none;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  color: #1e293b;
}

.sort-arrow {
  font-size: 0.7rem;
  margin-left: 0.35rem;
}

td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr:hover {
  background: #f8fafc;
}

/* No results */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  font-size: 1rem;
}

/* Sidebar transitions */
.slide-enter-active, .slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to, .slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Settings Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  margin: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 1.5rem;
}

.api-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.api-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
}

.api-info-row + .api-info-row {
  border-top: 1px solid #f1f5f9;
}

.api-info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.api-info-value {
  font-size: 0.8rem;
  color: #334155;
}

code.api-info-value {
  background: #e2e8f0;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  word-break: break-all;
}

.status-ok { color: #16a34a; font-weight: 600; }
.status-err { color: #dc2626; font-weight: 600; }
.status-testing { color: #ca8a04; font-weight: 500; }
.status-none { color: #94a3b8; }

.connection-details {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.conn-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  gap: 1rem;
}

.conn-detail-row + .conn-detail-row {
  border-top: 1px solid #dcfce7;
}

.conn-detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #166534;
  white-space: nowrap;
}

.conn-detail-value {
  font-size: 0.8rem;
  color: #15803d;
  text-align: right;
  word-break: break-word;
}

.conn-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.6rem 0.85rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #dc2626;
}

.modal-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.modal-field {
  margin-bottom: 1rem;
}

.modal-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.35rem;
}

.modal-field input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.modal-field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.modal-btn {
  padding: 0.55rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-btn.cancel {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.modal-btn.cancel:hover {
  background: #e2e8f0;
}

.modal-btn.test {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #16a34a;
}

.modal-btn.test:hover:not(:disabled) {
  background: #dcfce7;
}

.modal-btn.test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-btn.save {
  background: #3b82f6;
  border: none;
  color: white;
}

.modal-btn.save:hover:not(:disabled) {
  background: #2563eb;
}

.modal-btn.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar { width: 60px; }
  .sidebar .group-name, .sidebar .chevron, .sidebar .brand, .sidebar .query-list, .sidebar .logout-btn span:last-child {
    display: none;
  }
  .query-header { flex-direction: column; }
  .group-cards { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
}

/* ECL Preview */
.ecl-preview {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}

.ecl-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  background: #e2e8f0;
  border-radius: 0.25rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.ecl-code {
  font-size: 0.85rem;
  color: #334155;
  word-break: break-all;
  line-height: 1.5;
}

/* Placeholder Notice */
.placeholder-notice {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  font-size: 1rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 0.75rem;
}

/* Typeahead */
.typeahead-wrap {
  position: relative;
}

.typeahead-wrap input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.typeahead-wrap input:focus {
  border-color: #3b82f6;
}

.ta-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.ta-selected {
  display: block;
  font-size: 0.75rem;
  color: #16a34a;
  margin-top: 0.3rem;
  font-weight: 500;
}

.typeahead-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  list-style: none;
  margin: 0;
  padding: 0;
}

.typeahead-dropdown.ta-empty {
  padding: 0.75rem 1rem;
  color: #94a3b8;
  font-size: 0.85rem;
  text-align: center;
}

.ta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  gap: 0.75rem;
  transition: background 0.1s;
}

.ta-item:hover {
  background: #eff6ff;
}

.ta-display {
  font-size: 0.85rem;
  color: #1e293b;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ta-code {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
  flex-shrink: 0;
}
</style>
