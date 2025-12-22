import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiRequest, ApiResponse, RequestHistory, RequestTab } from '@/types/request'

const HISTORY_KEY = 'post-cat-spa-history'
const TABS_KEY = 'post-cat-spa-tabs'
const MAX_HISTORY = 50

function createDefaultRequest(): ApiRequest {
	return {
		method: 'GET',
		url: '',
		headers: [
			{ key: 'Content-Type', value: 'application/json', enabled: true },
		],
		queryParams: [],
		body: '',
		bodyType: 'json',
	}
}

export const useRequestStore = defineStore('request', () => {
	const tabs = ref<RequestTab[]>([])
	const activeTabId = ref<string>('')
	const history = ref<RequestHistory[]>([])

	// Computed properties for current tab
	const currentTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))
	const currentRequest = computed(() => currentTab.value?.request || createDefaultRequest())
	const currentResponse = computed(() => currentTab.value?.response || null)
	const isLoading = computed(() => currentTab.value?.isLoading || false)

	// Initialize with one tab
	function initializeTabs() {
		if (tabs.value.length === 0) {
			const newTab: RequestTab = {
				id: Date.now().toString(),
				name: 'New Request',
				request: createDefaultRequest(),
				response: null,
				isLoading: false,
			}
			tabs.value.push(newTab)
			activeTabId.value = newTab.id
			saveTabs()
		}
	}

	// Load tabs from localStorage
	function loadTabs() {
		const stored = localStorage.getItem(TABS_KEY)
		if (stored) {
			try {
				const data = JSON.parse(stored)
				tabs.value = data.tabs || []
				activeTabId.value = data.activeTabId || ''
				if (tabs.value.length === 0) {
					initializeTabs()
				}
			} catch (error) {
				console.error('Failed to load tabs:', error)
				initializeTabs()
			}
		} else {
			initializeTabs()
		}
	}

	// Save tabs to localStorage
	function saveTabs() {
		localStorage.setItem(TABS_KEY, JSON.stringify({
			tabs: tabs.value,
			activeTabId: activeTabId.value,
		}))
	}

	// Load history from localStorage
	function loadHistory() {
		const stored = localStorage.getItem(HISTORY_KEY)
		if (stored) {
			try {
				history.value = JSON.parse(stored)
			} catch (error) {
				console.error('Failed to load history:', error)
			}
		}
	}

	// Save history to localStorage
	function saveHistory() {
		// Keep only last MAX_HISTORY items
		if (history.value.length > MAX_HISTORY) {
			history.value = history.value.slice(-MAX_HISTORY)
		}
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
	}

	// Add to history
	function addToHistory(request: ApiRequest, response: ApiResponse | null) {
		const entry: RequestHistory = {
			id: Date.now().toString(),
			request: { ...request },
			response,
			timestamp: Date.now(),
		}
		history.value.unshift(entry)
		saveHistory()
	}

	// Clear history
	function clearHistory() {
		history.value = []
		localStorage.removeItem(HISTORY_KEY)
	}

	// Load from history
	function loadFromHistory(id: string) {
		const entry = history.value.find(h => h.id === id)
		if (entry && currentTab.value) {
			currentTab.value.request = { ...entry.request }
			currentTab.value.response = entry.response
			updateTabName()
			saveTabs()
		}
	}

	// Create new tab
	function createTab() {
		const newTab: RequestTab = {
			id: Date.now().toString(),
			name: 'New Request',
			request: createDefaultRequest(),
			response: null,
			isLoading: false,
		}
		tabs.value.push(newTab)
		activeTabId.value = newTab.id
		saveTabs()
		return newTab.id
	}

	// Close tab
	function closeTab(tabId: string) {
		const index = tabs.value.findIndex(t => t.id === tabId)
		if (index === -1) return

		tabs.value.splice(index, 1)

		// If closing active tab, switch to another
		if (activeTabId.value === tabId) {
			if (tabs.value.length === 0) {
				initializeTabs()
			} else {
				activeTabId.value = tabs.value[Math.max(0, index - 1)].id
			}
		}
		saveTabs()
	}

	// Set active tab
	function setActiveTab(tabId: string) {
		if (tabs.value.find(t => t.id === tabId)) {
			activeTabId.value = tabId
			saveTabs()
		}
	}

	// Update tab name based on request
	function updateTabName() {
		if (!currentTab.value) return
		const req = currentTab.value.request
		if (req.url) {
			try {
				const url = new URL(req.url)
				const path = url.pathname.split('/').filter(Boolean).pop() || 'Request'
				currentTab.value.name = `${req.method} ${path}`
			} catch {
				currentTab.value.name = `${req.method} Request`
			}
		} else {
			currentTab.value.name = 'New Request'
		}
		saveTabs()
	}

	// Set request
	function setRequest(request: Partial<ApiRequest>) {
		if (currentTab.value) {
			currentTab.value.request = { ...currentTab.value.request, ...request }
			updateTabName()
			saveTabs()
		}
	}

	// Set response
	function setResponse(response: ApiResponse | null) {
		if (currentTab.value) {
			currentTab.value.response = response
			saveTabs()
		}
	}

	// Set loading
	function setLoading(loading: boolean) {
		if (currentTab.value) {
			currentTab.value.isLoading = loading
			saveTabs()
		}
	}

	// Reset request
	function resetRequest() {
		if (currentTab.value) {
			currentTab.value.request = createDefaultRequest()
			currentTab.value.response = null
			updateTabName()
			saveTabs()
		}
	}

	// Initialize
	loadHistory()
	loadTabs()

	return {
		tabs,
		activeTabId,
		currentTab,
		currentRequest,
		currentResponse,
		isLoading,
		history,
		createTab,
		closeTab,
		setActiveTab,
		setRequest,
		setResponse,
		setLoading,
		resetRequest,
		addToHistory,
		clearHistory,
		loadFromHistory,
	}
})