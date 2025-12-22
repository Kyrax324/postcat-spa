import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Settings, ApiDocPath, Profile } from '@/types/environment'

const STORAGE_KEY = 'post-cat-spa-settings'

const defaultSettings: Settings = {
	apiDocsPath: '/storage/api-docs/api-docs.json',
	apiDocsPaths: [
		{ name: 'All APIs', path: '/storage/api-docs/api-docs.json' },
		{ name: 'Admin API', path: '/storage/api-docs/admin-api.json' },
		{ name: 'Public API', path: '/storage/api-docs/public-api.json' },
	],
	currentApiDocsPath: '/storage/api-docs/api-docs.json',
	defaultApiDocsPath: '/storage/api-docs/api-docs.json',
	profilePath: '/storage/api-docs/profile.json',
	encoding: 'utf-8',
	theme: 'dark',
	accentColor: 'blue',
	layoutMode: 'horizontal',
	timeout: 30000,
	selectedServerUrl: '',
}

export const useSettingsStore = defineStore('settings', () => {
	const settings = ref<Settings>({ ...defaultSettings })

	// Load settings from localStorage
	function loadSettings() {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			try {
				const loaded = JSON.parse(stored)
				settings.value = { ...defaultSettings, ...loaded }

				// Migrate old apiDocsPath to new structure if needed
				if (!loaded.apiDocsPaths && loaded.apiDocsPath) {
					settings.value.apiDocsPaths = [
						{ name: 'API Docs', path: loaded.apiDocsPath }
					]
					settings.value.currentApiDocsPath = loaded.apiDocsPath
					saveSettings()
				}
			} catch (error) {
				console.error('Failed to load settings:', error)
			}
		}
	}

	// Save settings to localStorage
	function saveSettings() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
	}

	// Update individual setting
	function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
		settings.value[key] = value
		saveSettings()
	}

	// API Docs Paths management
	function addApiDocPath(apiDocPath: ApiDocPath) {
		settings.value.apiDocsPaths.push(apiDocPath)
		saveSettings()
	}

	function updateApiDocPath(index: number, apiDocPath: ApiDocPath) {
		settings.value.apiDocsPaths[index] = apiDocPath
		saveSettings()
	}

	function deleteApiDocPath(index: number) {
		settings.value.apiDocsPaths.splice(index, 1)
		// If deleted path was current, switch to first available
		if (settings.value.currentApiDocsPath === settings.value.apiDocsPaths[index]?.path) {
			settings.value.currentApiDocsPath = settings.value.apiDocsPaths[0]?.path || ''
		}
		saveSettings()
	}

	function setCurrentApiDocsPath(path: string) {
		settings.value.currentApiDocsPath = path
		saveSettings()
	}

	// Profile management
	async function loadProfile(profilePath?: string): Promise<Profile | null> {
		const path = profilePath || settings.value.profilePath

		try {
			const response = await axios.get(path + '?t=' + Date.now(), {
				timeout: settings.value.timeout,
			})

			const profile: Profile = response.data

			// Validate profile structure
			if (!profile.name || !profile.version) {
				throw new Error('Invalid profile format: missing name or version')
			}

			return profile
		} catch (error) {
			console.error('Failed to load profile:', error)
			return null
		}
	}

	async function applyProfile(profile: Profile) {
		// Apply API docs paths
		if (profile.apiDocsPaths && profile.apiDocsPaths.length > 0) {
			settings.value.apiDocsPaths = profile.apiDocsPaths
			settings.value.currentApiDocsPath = profile.apiDocsPaths[0].path
		}

		// Apply profile settings
		if (profile.settings) {
			Object.entries(profile.settings).forEach(([key, value]) => {
				if (value !== undefined && key in settings.value) {
					(settings.value as any)[key] = value
				}
			})
		}

		saveSettings()
	}

	async function loadAndApplyProfile(profilePath?: string): Promise<boolean> {
		const profile = await loadProfile(profilePath)

		if (profile) {
			await applyProfile(profile)
			return true
		}

		return false
	}

	function setDefaultApiDocsPath(path: string) {
		settings.value.defaultApiDocsPath = path
		saveSettings()
	}

	function exportProfile(): Profile {
		return {
			name: 'Post Cat Profile',
			version: '1.0',
			description: 'Exported from Post Cat',
			apiDocsPaths: settings.value.apiDocsPaths,
			settings: {
				encoding: settings.value.encoding,
				theme: settings.value.theme,
				timeout: settings.value.timeout,
			}
		}
	}

	function downloadProfile() {
		const profile = exportProfile()
		const json = JSON.stringify(profile, null, 2)
		const blob = new Blob([json], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `post-cat-spa-profile-${Date.now()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	// Reset to defaults
	function resetSettings() {
		settings.value = { ...defaultSettings }
		saveSettings()
	}

	// Initialize on store creation
	loadSettings()

	return {
		settings,
		updateSetting,
		addApiDocPath,
		updateApiDocPath,
		deleteApiDocPath,
		setCurrentApiDocsPath,
		setDefaultApiDocsPath,
		loadProfile,
		applyProfile,
		loadAndApplyProfile,
		exportProfile,
		downloadProfile,
		resetSettings,
		saveSettings,
	}
})