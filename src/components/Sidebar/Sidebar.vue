<template>
	<div class="h-full flex flex-col">
		<!-- Search -->
		<div class="p-4 border-b border-gray-200 dark:border-gray-700">
			<n-input
				v-model:value="searchQuery"
				placeholder="Search endpoints..."
				clearable
				size="small"
			>
				<template #prefix>
					<span>🔍</span>
				</template>
			</n-input>
		</div>

		<!-- Endpoint Tree -->
		<div class="flex-1 overflow-y-auto p-4">
			<n-spin
				:show="apiDocsStore.loading"
				description="Loading..."
			>
				<div
					v-if="!apiDocsStore.spec"
					class="text-center text-gray-500 dark:text-gray-400 py-8"
				>
					<p>No API documentation loaded</p>
					<p class="text-sm mt-2">
						Configure path in Settings
					</p>
				</div>

				<div v-else-if="filteredTags.length === 0">
					<p class="text-gray-500 dark:text-gray-400 text-center py-8">
						No endpoints found
					</p>
				</div>

				<div
					v-else
					class="space-y-4"
				>
					<div
						v-for="tag in filteredTags"
						:key="tag"
					>
						<h3 class="font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
							<span>{{ tag }}</span>
							<span class="text-xs text-gray-500 dark:text-gray-400">
								{{ endpointsByTag[tag].length }}
							</span>
						</h3>

						<div class="space-y-1">
							<div
								v-for="endpoint in endpointsByTag[tag]"
								:key="endpoint.id"
								@click="$emit('selectEndpoint', endpoint)"
								class="p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								<div class="flex items-center gap-2">
									<span
										:class="getMethodClass(endpoint.method)"
										class="font-mono text-xs font-semibold px-2 py-1 rounded"
										style="min-width: 60px; text-align: center"
									>
										{{ endpoint.method }}
									</span>
									<span class="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
										{{ endpoint.path }}
									</span>
								</div>
								<p
									v-if="endpoint.summary"
									class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-16 truncate"
								>
									{{ endpoint.summary }}
								</p>
							</div>
						</div>
					</div>
				</div>
			</n-spin>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useApiDocsStore } from '@/stores/apiDocs'
	import type { Endpoint } from '@/types/openapi'

	defineEmits<{
		selectEndpoint: [endpoint: Endpoint]
	}>()

	const apiDocsStore = useApiDocsStore()
	const searchQuery = ref('')

	const endpointsByTag = computed(() => apiDocsStore.endpointsByTag)

	// Filter tags and endpoints by search query
	const filteredTags = computed(() => {
		if (!searchQuery.value) {
			return Object.keys(endpointsByTag.value)
		}

		const query = searchQuery.value.toLowerCase()
		const tags: string[] = []

		Object.entries(endpointsByTag.value).forEach(([tag, endpoints]) => {
			const hasMatch = endpoints.some(
				endpoint =>
					endpoint.path.toLowerCase().includes(query) ||
					endpoint.method.toLowerCase().includes(query) ||
					endpoint.summary?.toLowerCase().includes(query)
			)

			if (hasMatch) {
				tags.push(tag)
			}
		})

		return tags
	})

	function getMethodClass(method: string): string {
		const colors: Record<string, string> = {
			GET: 'text-green-500 bg-green-500/10',
			POST: 'text-yellow-500 bg-yellow-500/10',
			PUT: 'text-blue-500 bg-blue-500/10',
			PATCH: 'text-purple-500 bg-purple-500/10',
			DELETE: 'text-red-500 bg-red-500/10',
			HEAD: 'text-teal-500 bg-teal-500/10',
			OPTIONS: 'text-indigo-500 bg-indigo-500/10',
		}
		return colors[method] || 'text-gray-500 bg-gray-500/10'
	}
</script>

<style scoped></style>