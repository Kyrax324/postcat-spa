<template>
	<div class="h-full flex flex-col">
		<!-- Response Meta Info -->
		<div
			v-if="requestStore.currentResponse"
			class="p-5 border-b apple-divider"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-5">
					<n-tag
						:type="getStatusType(requestStore.currentResponse.status)"
						size="medium"
						:bordered="false"
						class="rounded-apple shadow-apple-sm font-semibold"
					>
						{{ requestStore.currentResponse.status }} {{ requestStore.currentResponse.statusText }}
					</n-tag>
					<div class="flex items-center gap-1.5 text-sm text-apple-gray-600 dark:text-apple-gray-400">
						<Icon
							icon="mdi:clock-outline"
							class="w-4 h-4"
						/>
						{{ requestStore.currentResponse.time }}ms
					</div>
					<div class="flex items-center gap-1.5 text-sm text-apple-gray-600 dark:text-apple-gray-400">
						<Icon
							icon="mdi:package-variant"
							class="w-4 h-4"
						/>
						{{ formatSize(requestStore.currentResponse.size) }}
					</div>
				</div>
				<n-button
					size="medium"
					secondary
					@click="copyResponse"
				>
					<template #icon>
						<Icon
							icon="mdi:content-copy"
							class="w-4 h-4"
						/>
					</template>
					Copy
				</n-button>
			</div>
		</div>

		<!-- Empty State -->
		<div
			v-if="!requestStore.currentResponse"
			class="flex-1 flex items-center justify-center text-apple-gray-400 dark:text-apple-gray-500"
		>
			<div class="text-center">
				<Icon
					icon="mdi:email-outline"
					class="w-16 h-16 mx-auto mb-4 opacity-30"
				/>
				<p class="text-base font-medium mb-2">No response yet</p>
				<p class="text-sm opacity-70">
					Send a request to see the response
				</p>
			</div>
		</div>

		<!-- Response Content -->
		<div
			v-else
			class="flex-1 overflow-hidden"
		>
			<n-tabs
				type="line"
				class="h-full"
				:tab-style="{ padding: '14px 20px', fontWeight: '500' }"
			>
				<n-tab-pane
					name="body"
					tab="Body"
				>
					<div class="h-full overflow-y-auto scrollbar-thin p-5 bg-apple-gray-50/30 dark:bg-apple-gray-900/30">
						<pre
							class="text-sm font-mono whitespace-pre-wrap break-words"
							style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.6;"
							v-html="highlightedBody"
						></pre>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="headers"
					tab="Headers"
				>
					<div class="p-5 space-y-2 overflow-y-auto scrollbar-thin h-full">
						<div
							v-for="(value, key) in requestStore.currentResponse.headers"
							:key="key"
							class="flex gap-4 py-3 px-3 rounded-apple bg-apple-gray-50/50 dark:bg-apple-gray-800/30 hover:bg-apple-gray-100/80 dark:hover:bg-apple-gray-700/40 transition-colors"
						>
							<span class="font-semibold text-apple-gray-700 dark:text-apple-gray-300 min-w-[200px]">
								{{ key }}:
							</span>
							<span class="text-apple-gray-600 dark:text-apple-gray-400 break-all">
								{{ value }}
							</span>
						</div>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="raw"
					tab="Raw"
				>
					<div class="h-full overflow-y-auto scrollbar-thin p-5 bg-apple-gray-50/30 dark:bg-apple-gray-900/30">
						<pre
							class="text-sm font-mono whitespace-pre-wrap break-words text-apple-gray-800 dark:text-apple-gray-200"
							style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.6;"
						>{{ rawResponse }}</pre>
					</div>
				</n-tab-pane>
			</n-tabs>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { Icon } from '@iconify/vue'
	import { useMessage } from 'naive-ui'
	import { useRequestStore } from '@/stores/request'
	import hljs from 'highlight.js/lib/core'
	import json from 'highlight.js/lib/languages/json'
	import 'highlight.js/styles/github-dark.css'

	hljs.registerLanguage('json', json)

	const message = useMessage()
	const requestStore = useRequestStore()

	const formattedBody = computed(() => {
		if (!requestStore.currentResponse?.data) return ''

		try {
			if (typeof requestStore.currentResponse.data === 'object') {
				return JSON.stringify(requestStore.currentResponse.data, null, 2)
			}
			return String(requestStore.currentResponse.data)
		} catch {
			return String(requestStore.currentResponse.data)
		}
	})

	const highlightedBody = computed(() => {
		if (!formattedBody.value) return ''
		try {
			return hljs.highlight(formattedBody.value, { language: 'json' }).value
		} catch {
			return formattedBody.value
		}
	})

	const rawResponse = computed(() => {
		if (!requestStore.currentResponse) return ''

		return JSON.stringify(
			{
				status: requestStore.currentResponse.status,
				statusText: requestStore.currentResponse.statusText,
				headers: requestStore.currentResponse.headers,
				data: requestStore.currentResponse.data,
				time: requestStore.currentResponse.time,
				size: requestStore.currentResponse.size,
			},
			null,
			2
		)
	})

	function getStatusType(status: number): 'success' | 'info' | 'warning' | 'error' | 'default' {
		if (status >= 200 && status < 300) return 'success'
		if (status >= 300 && status < 400) return 'info'
		if (status >= 400 && status < 500) return 'warning'
		if (status >= 500) return 'error'
		return 'default'
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
	}

	function copyResponse() {
		if (!requestStore.currentResponse) return

		navigator.clipboard.writeText(formattedBody.value)
		message.success('Response copied to clipboard')
	}
</script>

<style scoped></style>