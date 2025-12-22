import axios from 'axios'
import { useApiDocsStore } from '@/stores/apiDocs'
import { useSettingsStore } from '@/stores/settings'
import type { OpenAPISpec } from '@/types/openapi'

export function useOpenApiLoader() {
	const apiDocsStore = useApiDocsStore()
	const settingsStore = useSettingsStore()

	async function loadApiDocs(customPath?: string) {
		const path = customPath || settingsStore.settings.currentApiDocsPath || settingsStore.settings.apiDocsPath
		const encoding = settingsStore.settings.encoding

		apiDocsStore.setLoading(true)
		apiDocsStore.setError(null)

		try {
			const response = await axios.get(path + "?t=" + Date.now(), {
				timeout: settingsStore.settings.timeout,
			})

			let spec: OpenAPISpec

			// Handle encoding
			if (encoding === 'base64') {
				// Decode base64
				const decoded = atob(
					typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
				)
				spec = JSON.parse(decoded)
			} else {
				// Default UTF-8
				spec = response.data
			}

			// Validate basic OpenAPI structure
			if (!spec.openapi || !spec.paths) {
				throw new Error('Invalid OpenAPI specification format')
			}

			apiDocsStore.setSpec(spec)
			return spec
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: 'Failed to load API documentation'
			apiDocsStore.setError(message)
			throw error
		} finally {
			apiDocsStore.setLoading(false)
		}
	}

	async function reloadApiDocs() {
		return loadApiDocs()
	}

	return {
		loadApiDocs,
		reloadApiDocs,
	}
}