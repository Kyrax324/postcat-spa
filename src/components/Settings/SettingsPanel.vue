<template>
	<div class="flex h-[600px]">
		<!-- Side Navigation -->
		<div class="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
			<n-menu
				v-model:value="activeSection"
				:options="menuOptions"
			/>
		</div>

		<!-- Content Area -->
		<div class="flex-1 pl-6 overflow-y-auto">
			<!-- Profile Section -->
			<div
				v-if="activeSection === 'profile'"
				class="space-y-6"
			>
				<h3 class="text-lg font-semibold mb-4">Profile Management</h3>

				<div>
					<label class="block text-sm font-medium mb-2"> Profile Path </label>
					<div class="flex gap-2 mb-2">
						<n-input
							v-model:value="localSettings.profilePath"
							placeholder="/storage/api-docs/profile.json"
							class="flex-1"
						/>
						<n-button
							:loading="loadingProfile"
							@click="handleLoadProfile"
						>
							Load
						</n-button>
					</div>
					<div>
						<n-button
							size="small"
							@click="handleDownloadProfile"
						>
							Download Profile
						</n-button>
					</div>
					<p class="text-xs text-gray-500 mt-1">
						Load or export profile with API docs and settings
					</p>
				</div>
			</div>

			<!-- API Docs Section -->
			<div
				v-if="activeSection === 'api-docs'"
				class="space-y-6"
			>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">API Documentation Paths</h3>
					<n-button
						size="small"
						@click="showCreateApiDoc = true"
					>
						+ New
					</n-button>
				</div>

				<div class="space-y-2">
					<div
						v-for="(apiDoc, index) in localSettings.apiDocsPaths"
						:key="index"
						class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
						:class="{
							'border-blue-500 dark:border-blue-400':
								apiDoc.path === localSettings.defaultApiDocsPath,
						}"
					>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<p class="font-medium">
									{{ apiDoc.name }}
								</p>
								<n-tag
									v-if="apiDoc.path === localSettings.defaultApiDocsPath"
									size="small"
									type="info"
								>
									Default
								</n-tag>
							</div>
							<p class="text-xs text-gray-500">
								{{ apiDoc.path }}
							</p>
						</div>
						<div class="flex gap-2">
							<n-button
								v-if="apiDoc.path !== localSettings.defaultApiDocsPath"
								size="small"
								@click="setAsDefault(apiDoc.path)"
							>
								Set Default
							</n-button>
							<n-button
								size="small"
								@click="editApiDoc(index)"
							>
								Edit
							</n-button>
							<n-button
								size="small"
								type="error"
								:disabled="localSettings.apiDocsPaths.length === 1"
								@click="deleteApiDoc(index)"
							>
								Delete
							</n-button>
						</div>
					</div>
				</div>
			</div>

			<!-- Variables Section -->
			<div
				v-if="activeSection === 'variables'"
				class="space-y-6"
			>
				<h3 class="text-lg font-semibold mb-4">Variables</h3>

				<!-- API Servers -->
				<div class="border-b border-gray-200 dark:border-gray-700 pb-6">
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-md font-semibold">API Servers</h4>
					</div>
					<p class="text-xs text-gray-500 mb-3">
						Select a server from your OpenAPI spec. Use
						<code class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
							&#123;&#123;serverPath&#125;&#125;
						</code>
						in request URLs to reference the selected server.
					</p>
					<div v-if="apiServers.length > 0">
						<n-select
							:value="settingsStore.settings.selectedServerUrl"
							:options="serverOptions"
							placeholder="Select a server"
							@update:value="selectServer"
						/>
					</div>
					<div
						v-else
						class="text-sm text-gray-500"
					>
						No servers defined in the current API specification
					</div>
				</div>

				<!-- Custom Variables -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-md font-semibold">Custom Variables</h4>
						<n-button
							size="small"
							@click="addNewVariable"
						>
							+ Add Variable
						</n-button>
					</div>
					<p class="text-xs text-gray-500 mb-3">
						Define custom variables to use in your requests. Use
						&#123;&#123;variableName&#125;&#125; syntax in URLs, headers, and body.
					</p>

					<div
						v-if="customVariables.length > 0"
						class="space-y-2"
					>
						<div
							v-for="(variable, index) in customVariables"
							:key="index"
							class="flex gap-2 items-start p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800"
						>
							<n-checkbox
								v-model:checked="variable.enabled"
								@update:checked="variablesStore.saveVariables()"
							/>
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-2">
									<n-input
										v-model:value="variable.key"
										placeholder="Variable name (e.g., apiKey)"
										size="small"
										@blur="variablesStore.saveVariables()"
									/>
									<code
										v-if="variable.key"
										class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded whitespace-nowrap"
									>
										&#123;&#123;{{ variable.key }}&#125;&#125;
									</code>
								</div>
								<n-input
									v-model:value="variable.value"
									placeholder="Variable value"
									size="small"
									@blur="variablesStore.saveVariables()"
								/>
								<n-input
									v-model:value="variable.description"
									placeholder="Description (optional)"
									size="small"
									@blur="variablesStore.saveVariables()"
								/>
							</div>
							<n-button
								text
								type="error"
								@click="variablesStore.deleteVariable(index)"
							>
								<template #icon>
									<span>🗑️</span>
								</template>
							</n-button>
						</div>
					</div>
					<div
						v-else
						class="text-sm text-gray-500 text-center py-4"
					>
						No custom variables defined yet. Click "Add Variable" to create one.
					</div>
				</div>
			</div>

			<!-- General Settings Section -->
			<div
				v-if="activeSection === 'general'"
				class="space-y-6"
			>
				<h3 class="text-lg font-semibold mb-4">General Settings</h3>

				<!-- Encoding -->
				<div>
					<label class="block text-sm font-medium mb-2"> Encoding </label>
					<n-select
						v-model:value="localSettings.encoding"
						:options="encodingOptions"
						@update:value="autoSave('encoding', $event)"
					/>
				</div>

				<!-- Theme -->
				<div>
					<label class="block text-sm font-medium mb-2"> Theme </label>
					<n-select
						v-model:value="localSettings.theme"
						:options="themeOptions"
						@update:value="autoSave('theme', $event)"
					/>
					<p class="text-xs text-gray-500 mt-1">
						{{ getThemeDescription(localSettings.theme) }}
					</p>
				</div>

				<!-- Accent Color -->
				<div>
					<label class="block text-sm font-medium mb-2"> Accent Color </label>
					<div class="flex gap-3">
						<button
							v-for="color in accentColors"
							:key="color.value"
							:class="[
								'w-10 h-10 rounded-full border-2 transition-all',
								localSettings.accentColor === color.value
									? 'border-gray-900 dark:border-white scale-110'
									: 'border-transparent hover:scale-105',
							]"
							:style="{ backgroundColor: color.hex }"
							:title="color.label"
							@click="handleAccentColorChange(color.value)"
						/>
					</div>
				</div>

				<!-- Timeout -->
				<div>
					<label class="block text-sm font-medium mb-2"> Request Timeout (ms) </label>
					<n-input-number
						v-model:value="localSettings.timeout"
						:min="1000"
						:max="120000"
						:step="1000"
						class="w-full"
						@update:value="autoSave('timeout', $event)"
					/>
				</div>
			</div>

			<!-- About Section -->
			<div
				v-if="activeSection === 'about'"
				class="space-y-6"
			>
				<h3 class="text-lg font-semibold mb-4">About PostCat</h3>

				<div class="space-y-4">
					<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded">
						<p class="text-sm font-medium text-gray-700 dark:text-gray-300">Version</p>
						<p class="text-lg font-mono">{{ appVersion }}</p>
					</div>

					<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded">
						<p class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Build Time
						</p>
						<p class="text-sm font-mono">{{ buildTime }}</p>
					</div>

					<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded">
						<p class="text-sm font-medium text-gray-700 dark:text-gray-300">Mode</p>
						<p class="text-sm">{{ devMode ? 'Development' : 'Production' }}</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div
				class="flex justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700"
			>
				<n-button @click="handleReset"> Reset to Defaults </n-button>
			</div>
		</div>

		<!-- Create API Doc Modal -->
		<n-modal
			v-model:show="showCreateApiDoc"
			preset="dialog"
			title="Add API Documentation"
		>
			<n-form>
				<n-form-item label="Name">
					<n-input
						v-model:value="newApiDoc.name"
						placeholder="e.g. Admin API"
					/>
				</n-form-item>
				<n-form-item label="Path">
					<n-input
						v-model:value="newApiDoc.path"
						placeholder="/storage/api-docs/api-docs.json"
					/>
				</n-form-item>
			</n-form>
			<template #action>
				<n-button
					class="mr-2"
					@click="showCreateApiDoc = false"
				>
					Cancel
				</n-button>
				<n-button
					type="primary"
					@click="createApiDoc"
				>
					Add
				</n-button>
			</template>
		</n-modal>

		<!-- Edit API Doc Modal -->
		<n-modal
			v-model:show="showEditApiDoc"
			preset="dialog"
			title="Edit API Documentation"
		>
			<n-form v-if="editingApiDoc !== null">
				<n-form-item label="Name">
					<n-input
						v-model:value="localSettings.apiDocsPaths[editingApiDoc].name"
						placeholder="e.g. Admin API"
					/>
				</n-form-item>
				<n-form-item label="Path">
					<n-input
						v-model:value="localSettings.apiDocsPaths[editingApiDoc].path"
						placeholder="/storage/api-docs/api-docs.json"
					/>
				</n-form-item>
			</n-form>
			<template #action>
				<n-button
					class="mr-2"
					@click="showEditApiDoc = false"
				>
					Cancel
				</n-button>
				<n-button
					type="primary"
					@click="saveEditApiDoc"
				>
					Save
				</n-button>
			</template>
		</n-modal>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useMessage, useDialog } from 'naive-ui'
	import { useSettingsStore } from '@/stores/settings'
	import { useApiDocsStore } from '@/stores/apiDocs'
	import { useVariablesStore } from '@/stores/variables'
	import type { Settings, ApiDocPath } from '@/types/environment'

	const props = defineProps<{
		activeSection?: string
	}>()

	const emit = defineEmits<{
		close: []
		'update:activeSection': [value: string]
	}>()

	const activeSection = computed({
		get: () => props.activeSection || 'profile',
		set: (value: string) => emit('update:activeSection', value),
	})

	const message = useMessage()
	const dialog = useDialog()
	const settingsStore = useSettingsStore()
	const apiDocsStore = useApiDocsStore()
	const variablesStore = useVariablesStore()
	const localSettings = ref<Settings>({ ...settingsStore.settings })
	const showCreateApiDoc = ref(false)
	const showEditApiDoc = ref(false)
	const editingApiDoc = ref<number | null>(null)
	const newApiDoc = ref<ApiDocPath>({ name: '', path: '' })
	const loadingProfile = ref(false)

	// Version info
	const appVersion = computed(() => __APP_VERSION__)
	const buildTime = computed(() => new Date(__BUILD_TIME__).toLocaleString())
	const devMode = computed(() => __DEV_MODE__)

	// API Servers from OpenAPI spec
	const apiServers = computed(() => {
		if (!apiDocsStore.spec || !apiDocsStore.spec.servers) {
			return []
		}
		return apiDocsStore.spec.servers
	})

	// Format servers for n-select component
	const serverOptions = computed(() => {
		return apiServers.value.map(server => ({
			label: server.description ? `${server.url} - ${server.description}` : server.url,
			value: server.url,
		}))
	})

	// Filter out serverPath from custom variables (it's shown in API Servers section)
	const customVariables = computed(() => {
		return variablesStore.variables.filter(v => v.key !== 'serverPath')
	})

	const menuOptions = [
		{
			label: 'Profile',
			key: 'profile',
		},
		{
			label: 'API Docs',
			key: 'api-docs',
		},
		{
			label: 'Variables',
			key: 'variables',
		},
		{
			label: 'General',
			key: 'general',
		},
		{
			label: 'About',
			key: 'about',
		},
	]

	const encodingOptions = [
		{ label: 'UTF-8', value: 'utf-8' },
		{ label: 'Base64', value: 'base64' },
	]

	const themeOptions = [
		{ label: 'System (Auto)', value: 'system' },
		{ label: 'Light', value: 'light' },
		{ label: 'Dark', value: 'dark' },
	]

	const accentColors = [
		{ label: 'Green', value: 'green', hex: '#10b981' },
		{ label: 'Teal', value: 'teal', hex: '#14b8a6' },
		{ label: 'Blue', value: 'blue', hex: '#3b82f6' },
		{ label: 'Indigo', value: 'indigo', hex: '#6366f1' },
		{ label: 'Purple', value: 'purple', hex: '#a855f7' },
		{ label: 'Yellow', value: 'yellow', hex: '#eab308' },
		{ label: 'Orange', value: 'orange', hex: '#f97316' },
		{ label: 'Red', value: 'red', hex: '#ef4444' },
		{ label: 'Pink', value: 'pink', hex: '#ec4899' },
	]

	function getThemeDescription(theme: string): string {
		const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		if (theme === 'system') {
			return `Currently using ${systemPrefersDark ? 'dark' : 'light'} mode based on your system preferences`
		}
		return `Always use ${theme} mode`
	}

	async function handleLoadProfile() {
		loadingProfile.value = true
		try {
			const success = await settingsStore.loadAndApplyProfile(localSettings.value.profilePath)

			if (success) {
				// Reload local settings from store
				localSettings.value = { ...settingsStore.settings }
				message.success('Profile loaded successfully')
			} else {
				message.error('Failed to load profile. Check console for details.')
			}
		} catch (error) {
			message.error('Failed to load profile')
			console.error(error)
		} finally {
			loadingProfile.value = false
		}
	}

	function handleDownloadProfile() {
		try {
			settingsStore.downloadProfile()
			message.success('Profile downloaded successfully')
		} catch (error) {
			message.error('Failed to download profile')
			console.error(error)
		}
	}

	function setAsDefault(path: string) {
		localSettings.value.defaultApiDocsPath = path
		message.success('Default API docs path set')
	}

	function selectServer(serverUrl: string) {
		settingsStore.updateSetting('selectedServerUrl', serverUrl)
		variablesStore.setServerPath(serverUrl)
		message.success('Server selected')
	}

	function addNewVariable() {
		variablesStore.addVariable({
			key: '',
			value: '',
			description: '',
			enabled: true,
		})
	}

	function autoSave(key: keyof Settings, value: any) {
		settingsStore.updateSetting(key, value)
	}

	function handleAccentColorChange(color: string) {
		localSettings.value.accentColor = color as typeof localSettings.value.accentColor
		settingsStore.updateSetting('accentColor', color as any)
	}

	function handleReset() {
		dialog.warning({
			title: 'Reset Settings',
			content: 'Are you sure you want to reset all settings to defaults?',
			positiveText: 'Reset',
			negativeText: 'Cancel',
			onPositiveClick: () => {
				settingsStore.resetSettings()
				localSettings.value = { ...settingsStore.settings }
				message.success('Settings reset')
			},
		})
	}

	function createApiDoc() {
		if (!newApiDoc.value.name || !newApiDoc.value.path) {
			message.error('Please enter both name and path')
			return
		}

		localSettings.value.apiDocsPaths.push({ ...newApiDoc.value })
		newApiDoc.value = { name: '', path: '' }
		showCreateApiDoc.value = false
		message.success('API documentation path added')
	}

	function editApiDoc(index: number) {
		editingApiDoc.value = index
		showEditApiDoc.value = true
	}

	function saveEditApiDoc() {
		showEditApiDoc.value = false
		editingApiDoc.value = null
		message.success('API documentation path updated')
	}

	function deleteApiDoc(index: number) {
		if (localSettings.value.apiDocsPaths.length === 1) {
			message.error('Cannot delete the last API documentation path')
			return
		}

		dialog.warning({
			title: 'Delete API Documentation',
			content: 'Are you sure you want to delete this API documentation path?',
			positiveText: 'Delete',
			negativeText: 'Cancel',
			onPositiveClick: () => {
				const deletedPath = localSettings.value.apiDocsPaths[index].path
				localSettings.value.apiDocsPaths.splice(index, 1)

				// If deleted path was current, switch to first available
				if (localSettings.value.currentApiDocsPath === deletedPath) {
					localSettings.value.currentApiDocsPath =
						localSettings.value.apiDocsPaths[0].path
				}

				message.success('API documentation path deleted')
			},
		})
	}
</script>

<style scoped></style>
