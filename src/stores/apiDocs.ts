import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OpenAPISpec, Endpoint } from '@/types/openapi'

export const useApiDocsStore = defineStore('apiDocs', () => {
	const spec = ref<OpenAPISpec | null>(null)
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Parse OpenAPI spec into endpoint list
	const endpoints = computed<Endpoint[]>(() => {
		if (!spec.value || !spec.value.paths) return []

		const result: Endpoint[] = []

		Object.entries(spec.value.paths).forEach(([path, pathItem]) => {
			const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']

			methods.forEach(method => {
				const operation = pathItem[method as keyof typeof pathItem]
				if (operation && typeof operation === 'object') {
					result.push({
						id: `${method}-${path}`,
						path,
						method: method.toUpperCase(),
						summary: operation.summary || path,
						description: operation.description,
						tags: operation.tags || [],
						parameters: operation.parameters || [],
						requestBody: operation.requestBody,
						responses: operation.responses || {},
					})
				}
			})
		})

		return result
	})

	// Group endpoints by tags
	const endpointsByTag = computed(() => {
		const grouped: Record<string, Endpoint[]> = {}

		endpoints.value.forEach(endpoint => {
			if (endpoint.tags.length === 0) {
				if (!grouped['Untagged']) grouped['Untagged'] = []
				grouped['Untagged'].push(endpoint)
			} else {
				endpoint.tags.forEach(tag => {
					if (!grouped[tag]) grouped[tag] = []
					grouped[tag].push(endpoint)
				})
			}
		})

		return grouped
	})

	// Set the OpenAPI spec
	function setSpec(newSpec: OpenAPISpec) {
		spec.value = newSpec
		error.value = null
	}

	// Clear spec
	function clearSpec() {
		spec.value = null
		error.value = null
	}

	// Set loading state
	function setLoading(state: boolean) {
		loading.value = state
	}

	// Set error
	function setError(message: string|null) {
		error.value = message
		loading.value = false
	}

	return {
		spec,
		loading,
		error,
		endpoints,
		endpointsByTag,
		setSpec,
		clearSpec,
		setLoading,
		setError,
	}
})