import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Variable } from '@/types/environment'

const STORAGE_KEY = 'post-cat-spa-variables'

export const useVariablesStore = defineStore('variables', () => {
	const variables = ref<Variable[]>([])

	// Load variables from localStorage
	function loadVariables() {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			try {
				variables.value = JSON.parse(stored)
			} catch (error) {
				console.error('Failed to load variables:', error)
				variables.value = []
			}
		}
	}

	// Save variables to localStorage
	function saveVariables() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(variables.value))
	}

	// Get all enabled variables as key-value pairs
	const enabledVariables = computed(() => {
		const vars: Record<string, string> = {}
		variables.value.forEach(v => {
			if (v.enabled) {
				vars[v.key] = v.value
			}
		})
		return vars
	})

	// Add new variable
	function addVariable(variable: Variable) {
		variables.value.push(variable)
		saveVariables()
	}

	// Update variable
	function updateVariable(index: number, updates: Partial<Variable>) {
		if (variables.value[index]) {
			variables.value[index] = { ...variables.value[index], ...updates }
			saveVariables()
		}
	}

	// Delete variable
	function deleteVariable(index: number) {
		variables.value.splice(index, 1)
		saveVariables()
	}

	// Get variable value by key
	function getVariableValue(key: string): string | undefined {
		const variable = variables.value.find(v => v.key === key && v.enabled)
		return variable?.value
	}

	// Set or update serverPath variable
	function setServerPath(serverUrl: string) {
		const serverPathIndex = variables.value.findIndex(v => v.key === 'serverPath')

		if (serverPathIndex >= 0) {
			// Update existing serverPath
			variables.value[serverPathIndex].value = serverUrl
		} else {
			// Add new serverPath variable
			variables.value.unshift({
				key: 'serverPath',
				value: serverUrl,
				description: 'Selected API server URL',
				enabled: true,
			})
		}
		saveVariables()
	}

	// Interpolate variables in text
	function interpolate(text: string): string {
		if (!text) return text

		return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
			const trimmedName = varName.trim()
			const value = getVariableValue(trimmedName)
			return value !== undefined ? value : match
		})
	}

	// Initialize on store creation
	loadVariables()

	return {
		variables,
		enabledVariables,
		addVariable,
		updateVariable,
		deleteVariable,
		getVariableValue,
		setServerPath,
		interpolate,
		saveVariables,
	}
})
