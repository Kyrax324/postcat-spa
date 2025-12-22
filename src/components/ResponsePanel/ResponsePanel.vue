<template>
	<div class="h-full flex flex-col bg-white dark:bg-gray-800">
		<!-- Response Meta Info -->
		<div
			v-if="requestStore.currentResponse"
			class="p-4 border-b border-gray-200 dark:border-gray-700"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<n-tag
						:type="getStatusType(requestStore.currentResponse.status)"
						size="medium"
						:bordered="false"
					>
						{{ requestStore.currentResponse.status }} {{ requestStore.currentResponse.statusText }}
					</n-tag>
					<span class="text-sm text-gray-500 dark:text-gray-400">
						⏱️ {{ requestStore.currentResponse.time }}ms
					</span>
					<span class="text-sm text-gray-500 dark:text-gray-400">
						📦 {{ formatSize(requestStore.currentResponse.size) }}
					</span>
				</div>
				<n-button
					size="small"
					@click="copyResponse"
				>
					📋 Copy
				</n-button>
			</div>
		</div>

		<!-- Empty State -->
		<div
			v-if="!requestStore.currentResponse"
			class="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500"
		>
			<div class="text-center">
				<p class="text-lg mb-2">
					📭
				</p>
				<p>No response yet</p>
				<p class="text-sm mt-1">
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
				:tab-style="{ padding: '12px 16px' }"
			>
				<n-tab-pane
					name="body"
					tab="Body"
				>
					<div class="h-full overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
						<pre
							class="text-sm font-mono whitespace-pre-wrap break-words"
							v-html="highlightedBody"
						></pre>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="headers"
					tab="Headers"
				>
					<div class="p-4 space-y-2 overflow-y-auto h-full">
						<div
							v-for="(value, key) in requestStore.currentResponse.headers"
							:key="key"
							class="flex gap-4 py-2 border-b border-gray-100 dark:border-gray-700"
						>
							<span class="font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
								{{ key }}:
							</span>
							<span class="text-gray-600 dark:text-gray-400 break-all">
								{{ value }}
							</span>
						</div>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="raw"
					tab="Raw"
				>
					<div class="h-full overflow-y-auto p-4">
						<pre
							class="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200"
						>{{ rawResponse }}</pre>
					</div>
				</n-tab-pane>
			</n-tabs>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
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