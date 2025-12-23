<template>
	<div class="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-apple-gray-900 dark:via-slate-900 dark:to-blue-950">
		<!-- Header -->
		<div class="glass-effect border-b border-apple-gray-200/50 dark:border-apple-gray-700/50 px-4 md:px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 md:gap-4">
					<div class="flex items-center gap-3">
						<img
							:src="logoUrl"
							alt="PostCat"
							class="w-7 h-7"
						/>
						<h1 class="text-xl font-semibold tracking-tight text-apple-gray-900 dark:text-white">
							PostCat
						</h1>
					</div>
					<!-- API Docs Path Selector -->
					<div class="flex items-center gap-2">
						<n-select
							v-model:value="currentApiDocsPath"
							:options="apiDocsPathOptions"
							placeholder="Select API Docs"
							style="width: 220px"
							size="medium"
							class="rounded-apple"
						/>
						<n-button
							size="medium"
							:loading="apiDocsStore.loading"
							circle
							quaternary
							@click="handleReload"
						>
							<template #icon>
								<Icon
									icon="mdi:reload"
									class="w-5 h-5"
								/>
							</template>
						</n-button>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<!-- Variables Button -->
					<n-button
						size="medium"
						secondary
						strong
						class="rounded-apple shadow-apple-sm"
						@click="openVariables"
					>
						<template #icon>
							<Icon
								icon="mdi:variable-box"
								class="w-4 h-4"
							/>
						</template>
						Variables
					</n-button>
				</div>
			</div>

			<!-- Error Display -->
			<n-alert
				v-if="apiDocsStore.error"
				type="error"
				class="mt-4 rounded-apple shadow-apple-sm"
				closable
				@close="apiDocsStore.setError(null)"
			>
				{{ apiDocsStore.error }}
			</n-alert>
		</div>

		<!-- Main Content -->
		<div class="flex-1 flex overflow-hidden relative">
			<!-- Left: Sidebar -->
			<div
				v-if="!sidebarCollapsed"
				:style="{ width: `${sidebarWidth}px` }"
				class="bg-gradient-to-b from-white/90 to-blue-50/80 dark:from-apple-gray-800/90 dark:to-slate-900/80 backdrop-blur-apple border-r border-blue-200/50 dark:border-blue-700/30 overflow-y-auto flex-shrink-0 transition-all shadow-lg shadow-blue-500/5"
			>
				<Sidebar @select-endpoint="handleEndpointSelect" />
			</div>

			<!-- Sidebar Resizer -->
			<div
				v-if="!sidebarCollapsed"
				class="w-0.5 hover:w-1 bg-gradient-to-b from-blue-300 to-cyan-400 dark:from-blue-600 dark:to-cyan-700 hover:from-primary-500 hover:to-primary-600 cursor-col-resize transition-all flex-shrink-0 hover:shadow-lg hover:shadow-primary-500/50"
				@mousedown="startResizeSidebar"
			></div>

			<!-- Right: Main Panel (Tabs + Request/Response) -->
			<div class="flex-1 flex flex-col overflow-hidden min-w-0">
				<!-- Tabs Bar -->
				<TabBar
					:tabs="requestStore.tabs"
					:groups="requestStore.groups"
					:organized-tabs="requestStore.organizedTabs"
					:active-tab-id="requestStore.activeTabId"
					@select-tab="requestStore.setActiveTab"
					@close-tab="requestStore.closeTab"
					@create-tab="requestStore.createTab"
					@toggle-collapse="requestStore.toggleGroupCollapse"
					@create-group="handleCreateGroup"
					@rename-group="handleRenameGroup"
					@delete-group="handleDeleteGroup"
					@change-group-color="requestStore.changeGroupColor"
					@add-to-group="requestStore.addTabToGroup"
					@remove-from-group="requestStore.removeTabFromGroup"
					@close-other-tabs="handleCloseOtherTabs"
				/>

				<!-- Request/Response Area -->
				<div
					class="flex-1 flex flex-col overflow-hidden"
					:style="{ height: consoleStore.isVisible ? `${topHeight}px` : '100%' }"
				>
					<!-- URL Bar (shared) -->
					<div
						class="p-5 border-b border-apple-gray-200/50 dark:border-apple-gray-700/50 bg-white/60 dark:bg-apple-gray-800/60 backdrop-blur-apple flex-shrink-0"
					>
						<div class="flex gap-3">
							<n-select
								v-model:value="requestStore.currentRequest.method"
								:options="methodOptions"
								:render-label="renderMethodLabel"
								style="width: 120px"
								size="large"
							/>

							<RichPillInput
								v-model="requestStore.currentRequest.url"
								:suggestions="[
									{
										key: 'env',
										value: 'prod',
										description: 'Production environment',
									},
									{ key: 'status', value: 'error', description: 'Error status' },
								]"
								@query-change="(_pills: any, _raw: any) => console.log(_pills, _raw)"
							/>
							{{ searchQuery }}
							<VariableInputWithPills
								ref="urlInputRef"
								v-model="requestStore.currentRequest.url"
								placeholder="Enter request URL or use {{serverPath}}..."
								size="large"
								class="flex-1"
							>
							</VariableInputWithPills>
							<n-button
								type="primary"
								size="large"
								:loading="requestStore.isLoading"
								:disabled="!requestStore.currentRequest.url"
								strong
								class="rounded-apple px-8 font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 border-0"
								@click="handleSendRequest"
							>
								Send
							</n-button>
						</div>
					</div>

					<!-- Horizontal Layout -->
					<div
						v-if="settingsStore.settings.layoutMode === 'horizontal'"
						class="flex flex-1 overflow-hidden"
					>
						<!-- Request Panel (without URL bar) -->
						<div class="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/40 dark:bg-apple-gray-800/40 backdrop-blur-sm">
							<RequestPanel :hide-url-bar="true" />
						</div>

						<!-- Resizer -->
						<div
							class="w-0.5 hover:w-1 bg-apple-gray-300 dark:bg-apple-gray-600 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-col-resize transition-all flex-shrink-0"
							@mousedown="startResizeRequestResponse"
						></div>

						<!-- Response Panel -->
						<div
							:style="{ width: `${responseWidth}px` }"
							class="border-l border-apple-gray-200/50 dark:border-apple-gray-700/50 overflow-hidden flex-shrink-0 min-w-0 bg-white/40 dark:bg-apple-gray-800/40 backdrop-blur-sm"
						>
							<ResponsePanel />
						</div>
					</div>

					<!-- Vertical Layout -->
					<div
						v-else
						class="flex flex-col flex-1 overflow-hidden"
					>
						<!-- Request Panel (without URL bar) -->
						<div
							:style="{ height: `${requestHeight}px` }"
							class="overflow-hidden flex-shrink-0 bg-white/40 dark:bg-apple-gray-800/40 backdrop-blur-sm"
						>
							<RequestPanel :hide-url-bar="true" />
						</div>

						<!-- Resizer -->
						<div
							class="h-0.5 hover:h-1 bg-apple-gray-300 dark:bg-apple-gray-600 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-row-resize transition-all flex-shrink-0"
							@mousedown="startResizeRequestResponseVertical"
						></div>

						<!-- Response Panel -->
						<div
							class="flex-1 border-t border-apple-gray-200/50 dark:border-apple-gray-700/50 overflow-hidden min-h-0 bg-white/40 dark:bg-apple-gray-800/40 backdrop-blur-sm"
						>
							<ResponsePanel />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Console Resizer -->
		<div
			v-if="consoleStore.isVisible"
			class="h-0.5 hover:h-1 bg-apple-gray-300 dark:bg-apple-gray-600 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-row-resize transition-all flex-shrink-0"
			@mousedown="startResizeConsole"
		></div>

		<!-- Bottom: Console Panel -->
		<div
			v-if="consoleStore.isVisible"
			:style="{ height: `${consoleHeight}px` }"
			class="border-t border-apple-gray-200/50 dark:border-apple-gray-700/50 flex-shrink-0 bg-white/60 dark:bg-apple-gray-800/60 backdrop-blur-apple"
		>
			<ConsolePanel />
		</div>

		<!-- Bottom Status Bar -->
		<div
			class="glass-effect border-t border-apple-gray-200/50 dark:border-apple-gray-700/50 px-4 py-2 flex items-center justify-between text-apple-gray-600 dark:text-apple-gray-300 text-xs flex-shrink-0"
		>
			<div class="flex items-center gap-3">
				<!-- Collapse Sidebar Button -->
				<n-button
					text
					size="small"
					class="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-gray-900 dark:hover:text-white transition-colors"
					@click="toggleSidebar"
				>
					<template #icon>
						<Icon
							icon="mdi:dock-left"
							:width="18"
							:height="18"
						/>
					</template>
				</n-button>

				<!-- Console Toggle Button -->
				<n-button
					text
					size="small"
					class="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-gray-900 dark:hover:text-white transition-colors"
					@click="consoleStore.toggleVisibility()"
				>
					<template #icon>
						<Icon
							icon="mdi:console"
							:width="18"
							:height="18"
						/>
					</template>
					Console
					<n-badge
						v-if="consoleStore.logs.length > 0"
						:value="consoleStore.logs.length"
						:max="99"
						class="ml-1.5"
						type="primary"
					/>
				</n-button>
			</div>

			<div class="flex items-center gap-3">
				<!-- Layout Toggle -->
				<n-button
					text
					size="small"
					class="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-gray-900 dark:hover:text-white transition-colors"
					@click="toggleLayoutMode"
				>
					<template #icon>
						<Icon
							:icon="
								settingsStore.settings.layoutMode === 'horizontal'
									? 'mdi:view-split-vertical'
									: 'mdi:view-split-horizontal'
							"
							:width="18"
							:height="18"
						/>
					</template>
				</n-button>
				<!-- Settings -->
				<n-button
					text
					size="small"
					class="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-gray-900 dark:hover:text-white transition-colors"
					@click="showSettings = true"
				>
					<template #icon>
						<Icon
							icon="mdi:cog"
							:width="18"
							:height="18"
						/>
					</template>
				</n-button>
			</div>
		</div>

		<!-- Settings Modal -->
		<n-modal
			v-model:show="showSettings"
			preset="card"
			title="Settings"
			style="width: 900px; border-radius: 18px; overflow: hidden;"
			class="rounded-apple-xl shadow-apple-xl"
		>
			<SettingsPanel
				v-model:active-section="settingsActiveSection"
				@close="showSettings = false"
			/>
		</n-modal>

		<!-- Group Dialog -->
		<GroupDialog
			v-model:show="showGroupDialog"
			:mode="groupDialogMode"
			:initial-name="groupDialogInitialName"
			:initial-color="groupDialogInitialColor"
			@confirm="handleGroupDialogConfirm"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, h, onMounted, onUnmounted } from 'vue'
	import { Icon } from '@iconify/vue'
	import { useMessage } from 'naive-ui'
	import { useApiDocsStore } from '@/stores/apiDocs'
	import { useRequestStore } from '@/stores/request'
	import { useSettingsStore } from '@/stores/settings'
	import { useConsoleStore } from '@/stores/console'
	import { useVariablesStore } from '@/stores/variables'
	import { useOpenApiLoader } from '@/composables/useOpenApiLoader'
	import { useRequestExecutor } from '@/composables/useRequestExecutor'
	import Sidebar from '@/components/Sidebar/Sidebar.vue'
	import RequestPanel from '@/components/RequestPanel/RequestPanel.vue'
	import ResponsePanel from '@/components/ResponsePanel/ResponsePanel.vue'
	import SettingsPanel from '@/components/Settings/SettingsPanel.vue'
	import ConsolePanel from '@/components/Console/ConsolePanel.vue'
	import VariableInputWithPills from '@/components/VariableInputWithPills.vue'
	import TabBar from '@/components/TabBar/TabBar.vue'
	import GroupDialog from '@/components/Dialogs/GroupDialog.vue'
	import type { Endpoint } from '@/types/openapi'
	import type { TabGroupColor } from '@/types/request'
	import RichPillInput from '@/components/RichPillInput.vue'

	const message = useMessage()
	const apiDocsStore = useApiDocsStore()
	const requestStore = useRequestStore()
	const settingsStore = useSettingsStore()
	const consoleStore = useConsoleStore()
	const variablesStore = useVariablesStore()
	const { loadApiDocs } = useOpenApiLoader()
	const { executeRequest } = useRequestExecutor()

	const showSettings = ref(false)
	const settingsActiveSection = ref('profile')
	const sidebarCollapsed = ref(false)
	const urlInputRef = ref<any>(null)

	// Group dialog state
	const showGroupDialog = ref(false)
	const groupDialogMode = ref<'create' | 'rename'>('create')
	const groupDialogInitialName = ref('')
	const groupDialogInitialColor = ref<TabGroupColor>('blue')
	const groupDialogTargetId = ref('')

	// HTTP method options with colors
	const getMethodColor = (method: string): string => {
		const colors: Record<string, string> = {
			GET: '#10b981',
			POST: '#eab308',
			PUT: '#3b82f6',
			PATCH: '#a855f7',
			DELETE: '#ef4444',
			HEAD: '#14b8a6',
			OPTIONS: '#6366f1',
		}
		return colors[method] || '#6b7280'
	}

	const methodOptions = [
		{ label: 'GET', value: 'GET' },
		{ label: 'POST', value: 'POST' },
		{ label: 'PUT', value: 'PUT' },
		{ label: 'PATCH', value: 'PATCH' },
		{ label: 'DELETE', value: 'DELETE' },
		{ label: 'HEAD', value: 'HEAD' },
		{ label: 'OPTIONS', value: 'OPTIONS' },
	]

	const renderMethodLabel = (option: { label: string; value: string }) => {
		return h(
			'span',
			{
				style: {
					color: getMethodColor(option.value),
					fontWeight: '600',
					fontFamily: 'monospace',
				},
			},
			option.label
		)
	}

	// Handle send request
	async function handleSendRequest() {
		if (!requestStore.currentRequest.url) {
			message.warning('Please enter a URL')
			return
		}
		await executeRequest()
	}

	const searchQuery = ref()

	// Logo URL
	const assetBase = window.__APP_BASE__ || ''
	const logoUrl = assetBase + '/assets/logo.svg'

	// Panel widths and heights
	const sidebarWidth = ref(320)
	const responseWidth = ref(Math.floor((window.innerWidth - 320 - 2) / 2)) // 50% of available width
	const requestHeight = ref(Math.floor((window.innerHeight - 60 - 41) / 2)) // 50% of available height (minus header + tabs)
	const consoleHeight = ref(250)
	const topHeight = ref(window.innerHeight * 0.67)

	// Resizing state
	const isResizingSidebar = ref(false)
	const isResizingRequestResponse = ref(false)
	const isResizingRequestResponseVertical = ref(false)
	const isResizingConsole = ref(false)

	// Toggle layout mode
	function toggleLayoutMode() {
		const newMode =
			settingsStore.settings.layoutMode === 'horizontal' ? 'vertical' : 'horizontal'
		settingsStore.updateSetting('layoutMode', newMode)

		// Reset to 50/50 split when toggling
		if (newMode === 'horizontal') {
			const containerWidth = window.innerWidth - sidebarWidth.value - 2
			responseWidth.value = Math.floor(containerWidth / 2)
		} else {
			const containerHeight = consoleStore.isVisible
				? window.innerHeight - 60 - consoleHeight.value - 41 // header + console + tabs
				: window.innerHeight - 60 - 41 // header + tabs
			requestHeight.value = Math.floor(containerHeight / 2)
		}
	}

	// Toggle sidebar
	function toggleSidebar() {
		sidebarCollapsed.value = !sidebarCollapsed.value
	}

	// Current API docs path selection
	const currentApiDocsPath = computed({
		get: () => settingsStore.settings.currentApiDocsPath,
		set: value => {
			settingsStore.setCurrentApiDocsPath(value)
			loadApiDocs()
		},
	})

	// API Docs path options for select
	const apiDocsPathOptions = computed(() =>
		settingsStore.settings.apiDocsPaths.map(doc => ({
			label: doc.name,
			value: doc.path,
		}))
	)

	// Handle endpoint selection from sidebar
	function handleEndpointSelect(endpoint: Endpoint) {
		// Check if endpoint.path is already a full URL
		let url: string
		if (endpoint.path.startsWith('http://') || endpoint.path.startsWith('https://')) {
			url = endpoint.path
		} else {
			// Use {{serverPath}} variable for relative paths
			url = `{{serverPath}}${endpoint.path}`
		}

		// Set request details
		requestStore.setRequest({
			method: endpoint.method,
			url: url,
			queryParams: endpoint.parameters
				.filter(p => p.in === 'query')
				.map(p => ({
					key: p.name,
					value: p.schema?.default?.toString() || '',
					enabled: p.required || false,
				})),
			headers: [
				{ key: 'Content-Type', value: 'application/json', enabled: true },
				...endpoint.parameters
					.filter(p => p.in === 'header')
					.map(p => ({
						key: p.name,
						value: p.schema?.default?.toString() || '',
						enabled: p.required || false,
					})),
			],
		})

		message.success(`Loaded ${endpoint.method} ${endpoint.path}`)
	}

	// Reload API docs
	async function handleReload() {
		try {
			await loadApiDocs()
			message.success('API documentation reloaded')
		} catch (error) {
			message.error('Failed to reload API documentation')
		}
	}

	// Open variables section
	function openVariables() {
		settingsActiveSection.value = 'variables'
		showSettings.value = true
	}

	// Group management handlers
	function handleCreateGroup(tabId: string) {
		groupDialogMode.value = 'create'
		groupDialogInitialName.value = ''
		groupDialogInitialColor.value = 'blue'
		groupDialogTargetId.value = tabId
		showGroupDialog.value = true
	}

	function handleRenameGroup(groupId: string) {
		const group = requestStore.getGroupById(groupId)
		if (!group) return

		groupDialogMode.value = 'rename'
		groupDialogInitialName.value = group.name
		groupDialogInitialColor.value = group.color
		groupDialogTargetId.value = groupId
		showGroupDialog.value = true
	}

	function handleDeleteGroup(groupId: string, mode: 'ungroup' | 'close-tabs') {
		const group = requestStore.getGroupById(groupId)
		if (!group) return

		if (mode === 'close-tabs') {
			const tabCount = requestStore.getTabsInGroup(groupId).length
			if (
				confirm(
					`Are you sure you want to close "${group.name}" and all ${tabCount} tabs in it?`
				)
			) {
				requestStore.deleteGroup(groupId, 'close-tabs')
				message.success(`Closed group "${group.name}"`)
			}
		} else {
			requestStore.deleteGroup(groupId, 'ungroup')
			message.success(`Ungrouped tabs from "${group.name}"`)
		}
	}

	function handleGroupDialogConfirm(name: string, color: TabGroupColor) {
		if (groupDialogMode.value === 'create') {
			const tabId = groupDialogTargetId.value
			requestStore.createGroup(name, color, [tabId])
			message.success(`Created group "${name}"`)
		} else {
			const groupId = groupDialogTargetId.value
			requestStore.renameGroup(groupId, name)
			requestStore.changeGroupColor(groupId, color)
			message.success(`Updated group "${name}"`)
		}
	}

	function handleCloseOtherTabs(tabId: string) {
		const otherTabs = requestStore.tabs.filter(t => t.id !== tabId)
		otherTabs.forEach(tab => requestStore.closeTab(tab.id))
		message.success('Closed other tabs')
	}

	// Sidebar resize handlers
	function startResizeSidebar(e: MouseEvent) {
		isResizingSidebar.value = true
		e.preventDefault()
	}

	function handleResizeSidebar(e: MouseEvent) {
		if (!isResizingSidebar.value) return
		sidebarWidth.value = Math.max(200, Math.min(600, e.clientX))
	}

	function stopResizeSidebar() {
		isResizingSidebar.value = false
	}

	// Request/Response resize handlers
	function startResizeRequestResponse(e: MouseEvent) {
		isResizingRequestResponse.value = true
		e.preventDefault()
	}

	function handleResizeRequestResponse(e: MouseEvent) {
		if (!isResizingRequestResponse.value) return
		const containerWidth = window.innerWidth - sidebarWidth.value - 2 // Subtract sidebar width and resizer
		const offsetX = e.clientX - sidebarWidth.value - 2 // Mouse position relative to right panel
		const newResponseWidth = containerWidth - offsetX
		responseWidth.value = Math.max(300, Math.min(containerWidth - 300, newResponseWidth))
	}

	function stopResizeRequestResponse() {
		isResizingRequestResponse.value = false
	}

	// Request/Response vertical resize handlers
	function startResizeRequestResponseVertical(e: MouseEvent) {
		isResizingRequestResponseVertical.value = true
		e.preventDefault()
	}

	function handleResizeRequestResponseVertical(e: MouseEvent) {
		if (!isResizingRequestResponseVertical.value) return
		const containerHeight = consoleStore.isVisible
			? window.innerHeight - 60 - consoleHeight.value
			: window.innerHeight - 60
		const tabsHeight = 41 // Approximate tabs bar height
		const newRequestHeight = e.clientY - 60 - tabsHeight
		requestHeight.value = Math.max(200, Math.min(containerHeight - 200, newRequestHeight))
	}

	function stopResizeRequestResponseVertical() {
		isResizingRequestResponseVertical.value = false
	}

	// Console resize handlers
	function startResizeConsole(e: MouseEvent) {
		isResizingConsole.value = true
		e.preventDefault()
	}

	function handleResizeConsole(e: MouseEvent) {
		if (!isResizingConsole.value) return
		const containerHeight = window.innerHeight - 60 // Subtract header height
		const newConsoleHeight = containerHeight - e.clientY + 60
		consoleHeight.value = Math.max(150, Math.min(containerHeight * 0.5, newConsoleHeight))
		topHeight.value = containerHeight - consoleHeight.value - 1
	}

	function stopResizeConsole() {
		isResizingConsole.value = false
	}

	// Global mouse handlers
	function handleMouseMove(e: MouseEvent) {
		handleResizeSidebar(e)
		handleResizeRequestResponse(e)
		handleResizeRequestResponseVertical(e)
		handleResizeConsole(e)
	}

	function handleMouseUp() {
		stopResizeSidebar()
		stopResizeRequestResponse()
		stopResizeRequestResponseVertical()
		stopResizeConsole()
	}

	// Window resize handler
	function handleWindowResize() {
		const containerHeight = window.innerHeight - 60
		if (consoleStore.isVisible) {
			topHeight.value = containerHeight - consoleHeight.value - 1
		}
	}

	// Load API docs on mount
	onMounted(async () => {
		try {
			await loadApiDocs()

			// Initialize serverPath variable
			if (settingsStore.settings.selectedServerUrl) {
				// Use already selected server
				variablesStore.setServerPath(settingsStore.settings.selectedServerUrl)
			} else if (apiDocsStore.spec?.servers && apiDocsStore.spec.servers.length > 0) {
				// Auto-select first server if none selected
				const firstServer = apiDocsStore.spec.servers[0].url
				settingsStore.updateSetting('selectedServerUrl', firstServer)
				variablesStore.setServerPath(firstServer)
			}
		} catch (error) {
			console.error('Failed to load API docs:', error)
		}

		// Add global event listeners
		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)
		window.addEventListener('resize', handleWindowResize)
	})

	onUnmounted(() => {
		window.removeEventListener('mousemove', handleMouseMove)
		window.removeEventListener('mouseup', handleMouseUp)
		window.removeEventListener('resize', handleWindowResize)
	})
</script>

<style scoped></style>
