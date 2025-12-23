<template>
	<div class="h-full flex flex-col">
		<!-- Search -->
		<div class="p-4 border-b apple-divider">
			<n-input
				v-model:value="searchQuery"
				placeholder="Search endpoints..."
				clearable
				size="medium"
				class="rounded-apple"
			>
				<template #prefix>
					<Icon
						icon="mdi:magnify"
						class="w-4 h-4 text-apple-gray-400"
					/>
				</template>
			</n-input>
		</div>

		<!-- Endpoint Tree -->
		<div class="flex-1 overflow-y-auto scrollbar-thin p-4">
			<n-spin
				:show="apiDocsStore.loading"
				description="Loading..."
			>
				<div
					v-if="!apiDocsStore.spec"
					class="text-center text-apple-gray-500 dark:text-apple-gray-400 py-12"
				>
					<Icon
						icon="mdi:file-document-outline"
						class="w-12 h-12 mx-auto mb-3 opacity-40"
					/>
					<p class="font-medium mb-1">No API documentation loaded</p>
					<p class="text-xs opacity-70">
						Configure path in Settings
					</p>
				</div>

				<div v-else-if="filteredTags.length === 0">
					<p class="text-apple-gray-500 dark:text-apple-gray-400 text-center py-12">
						<Icon
							icon="mdi:magnify"
							class="w-10 h-10 mx-auto mb-2 opacity-40"
						/>
						No endpoints found
					</p>
				</div>

				<div
					v-else
					class="space-y-6"
				>
					<div
						v-for="tag in filteredTags"
						:key="tag"
					>
						<h3 class="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between px-2">
							<span>{{ tag }}</span>
							<span class="text-apple-gray-400 dark:text-apple-gray-500 normal-case">
								{{ endpointsByTag[tag].length }}
							</span>
						</h3>

						<div class="space-y-0.5">
							<div
								v-for="endpoint in endpointsByTag[tag]"
								:key="endpoint.id"
								@click="$emit('selectEndpoint', endpoint)"
								class="px-3 py-2.5 rounded-apple cursor-pointer hover:bg-apple-gray-100/80 dark:hover:bg-apple-gray-700/50 transition-all apple-hover"
							>
								<div class="flex items-center gap-2.5">
									<span
										:class="getMethodClass(endpoint.method)"
										class="font-mono text-xs font-semibold px-2.5 py-1 rounded-md shadow-apple-sm"
										style="min-width: 64px; text-align: center"
									>
										{{ endpoint.method }}
									</span>
									<span class="text-sm text-apple-gray-800 dark:text-apple-gray-200 flex-1 truncate font-medium tracking-tight">
										{{ endpoint.path }}
									</span>
								</div>
								<p
									v-if="endpoint.summary"
									class="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1.5 ml-[74px] truncate"
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
	import { Icon } from '@iconify/vue'
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
			GET: 'text-white dark:text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30',
			POST: 'text-white dark:text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30',
			PUT: 'text-white dark:text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30',
			PATCH: 'text-white dark:text-white bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30',
			DELETE: 'text-white dark:text-white bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30',
			HEAD: 'text-white dark:text-white bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30',
			OPTIONS: 'text-white dark:text-white bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30',
		}
		return colors[method] || 'text-apple-gray-600 dark:text-apple-gray-400 bg-apple-gray-500/15'
	}
</script>

<style scoped></style>