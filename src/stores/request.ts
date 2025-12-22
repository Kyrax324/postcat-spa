import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
	ApiRequest,
	ApiResponse,
	RequestHistory,
	RequestTab,
	TabGroup,
	TabGroupColor,
} from '@/types/request'

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
	const groups = ref<TabGroup[]>([])

	// Computed properties for current tab
	const currentTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))
	const currentRequest = computed(() => currentTab.value?.request || createDefaultRequest())
	const currentResponse = computed(() => currentTab.value?.response || null)
	const isLoading = computed(() => currentTab.value?.isLoading || false)

	// Computed properties for groups
	const organizedTabs = computed(() => {
		const ungrouped: RequestTab[] = []
		const grouped: Record<string, RequestTab[]> = {}

		tabs.value.forEach((tab) => {
			if (!tab.groupId) {
				ungrouped.push(tab)
			} else {
				if (!grouped[tab.groupId]) {
					grouped[tab.groupId] = []
				}
				grouped[tab.groupId].push(tab)
			}
		})

		return { ungrouped, grouped }
	})

	const getGroupById = (groupId: string) => {
		return groups.value.find((g) => g.id === groupId)
	}

	const getTabsInGroup = (groupId: string) => {
		return tabs.value.filter((t) => t.groupId === groupId)
	}

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

				// Backward compatibility: Check for version
				if (!data.version || data.version === 1) {
					// Old format - just tabs
					tabs.value = data.tabs || []
					activeTabId.value = data.activeTabId || ''
					groups.value = [] // No groups in old format
				} else {
					// New format with groups
					tabs.value = data.tabs || []
					activeTabId.value = data.activeTabId || ''
					groups.value = data.groups || []
				}

				// Clean up orphaned references
				cleanupOrphanedGroupRefs()

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
		localStorage.setItem(
			TABS_KEY,
			JSON.stringify({
				tabs: tabs.value,
				activeTabId: activeTabId.value,
				groups: groups.value,
				version: 2,
			})
		)
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
		const index = tabs.value.findIndex((t) => t.id === tabId)
		if (index === -1) return

		const closingTab = tabs.value[index]
		const wasInGroup = closingTab.groupId

		tabs.value.splice(index, 1)

		// Check if this was the last tab in a group
		if (wasInGroup) {
			const remainingTabsInGroup = tabs.value.filter((t) => t.groupId === wasInGroup)
			if (remainingTabsInGroup.length === 0) {
				// Auto-delete empty group
				const groupIndex = groups.value.findIndex((g) => g.id === wasInGroup)
				if (groupIndex !== -1) {
					groups.value.splice(groupIndex, 1)
				}
			}
		}

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

	// Group CRUD operations
	function createGroup(name: string, color: TabGroupColor, tabIds: string[] = []) {
		const newGroup: TabGroup = {
			id: Date.now().toString(),
			name,
			color,
			isCollapsed: false,
			createdAt: Date.now(),
		}

		groups.value.push(newGroup)

		// Add specified tabs to the group
		tabIds.forEach((tabId) => {
			const tab = tabs.value.find((t) => t.id === tabId)
			if (tab) {
				tab.groupId = newGroup.id
			}
		})

		saveTabs()
		return newGroup.id
	}

	function renameGroup(groupId: string, newName: string) {
		const group = groups.value.find((g) => g.id === groupId)
		if (group) {
			group.name = newName
			saveTabs()
		}
	}

	function changeGroupColor(groupId: string, newColor: TabGroupColor) {
		const group = groups.value.find((g) => g.id === groupId)
		if (group) {
			group.color = newColor
			saveTabs()
		}
	}

	function toggleGroupCollapse(groupId: string) {
		const group = groups.value.find((g) => g.id === groupId)
		if (!group) return

		group.isCollapsed = !group.isCollapsed

		// If collapsing a group with the active tab, switch to another tab
		if (group.isCollapsed) {
			const currentTabInGroup =
				currentTab.value && currentTab.value.groupId === groupId
			if (currentTabInGroup) {
				// Try to find an uncollapsed tab
				const visibleTab = tabs.value.find((t) => {
					if (!t.groupId) return true // Ungrouped tabs are always visible
					const tabGroup = groups.value.find((g) => g.id === t.groupId)
					return !tabGroup?.isCollapsed
				})

				if (visibleTab) {
					activeTabId.value = visibleTab.id
				}
			}
		}

		saveTabs()
	}

	function deleteGroup(groupId: string, mode: 'ungroup' | 'close-tabs' = 'ungroup') {
		const groupIndex = groups.value.findIndex((g) => g.id === groupId)
		if (groupIndex === -1) return

		if (mode === 'close-tabs') {
			// Close all tabs in the group
			const tabsToClose = tabs.value.filter((t) => t.groupId === groupId)
			tabsToClose.forEach((tab) => closeTab(tab.id))
		} else {
			// Ungroup tabs (remove groupId reference)
			tabs.value.forEach((tab) => {
				if (tab.groupId === groupId) {
					delete tab.groupId
				}
			})
		}

		// Remove the group
		groups.value.splice(groupIndex, 1)
		saveTabs()
	}

	function addTabToGroup(tabId: string, groupId: string) {
		const tab = tabs.value.find((t) => t.id === tabId)
		const group = groups.value.find((g) => g.id === groupId)

		if (tab && group) {
			tab.groupId = groupId
			saveTabs()
		}
	}

	function removeTabFromGroup(tabId: string) {
		const tab = tabs.value.find((t) => t.id === tabId)
		if (tab) {
			delete tab.groupId
			saveTabs()
		}
	}

	function cleanupOrphanedGroupRefs() {
		const groupIds = new Set(groups.value.map((g) => g.id))

		tabs.value.forEach((tab) => {
			if (tab.groupId && !groupIds.has(tab.groupId)) {
				delete tab.groupId
			}
		})
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
		groups,
		organizedTabs,
		getGroupById,
		getTabsInGroup,
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
		createGroup,
		renameGroup,
		changeGroupColor,
		toggleGroupCollapse,
		deleteGroup,
		addTabToGroup,
		removeTabFromGroup,
	}
})