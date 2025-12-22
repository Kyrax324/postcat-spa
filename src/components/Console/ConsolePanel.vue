<template>
	<div class="h-full flex flex-col bg-gray-900 text-gray-100">
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-2 border-b border-gray-700">
			<div class="flex items-center gap-3">
				<!-- Search -->
				<n-input
					v-model:value="consoleStore.filters.search"
					placeholder="Find and replace"
					size="small"
					clearable
					style="width: 200px"
				>
					<template #prefix>
						<span class="text-gray-400 text-xs">🔍</span>
					</template>
				</n-input>

				<div class="h-4 w-px bg-gray-700" />

				<!-- Console Tab -->
				<span class="text-sm font-medium text-white border-b-2 border-primary-500 pb-1">
					Console
				</span>
			</div>

			<div class="flex items-center gap-3">
				<!-- Log Level Dropdown -->
				<n-dropdown
					trigger="click"
					:options="levelFilterOptions"
					@select="handleLevelFilterSelect"
				>
					<n-button
						text
						size="small"
						class="text-gray-300"
					>
						All Logs
						<template #icon-right>
							<span class="ml-1">▼</span>
						</template>
					</n-button>
				</n-dropdown>

				<!-- Clear Button -->
				<n-button
					text
					size="small"
					class="text-gray-300"
					@click="consoleStore.clear()"
				>
					Clear
				</n-button>

				<!-- Filter Icons -->
				<div class="flex items-center gap-1">
					<n-button
						text
						size="small"
						class="text-gray-400"
					>
						⚙
					</n-button>
					<n-button
						text
						size="small"
						class="text-gray-400"
						@click="consoleStore.hide()"
					>
						✕
					</n-button>
				</div>
			</div>
		</div>

		<!-- Logs -->
		<div class="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
			<div
				v-if="consoleStore.filteredLogs.length === 0"
				class="flex flex-col items-center justify-center h-full text-center text-gray-500"
			>
				<p class="text-sm font-medium">No logs yet</p>
				<p class="text-xs mt-1">Send a request to view its details in the console.</p>
			</div>

			<div
				v-for="log in consoleStore.filteredLogs"
				:key="log.id"
				class="p-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
				@click="expandedLogId = expandedLogId === log.id ? null : log.id"
			>
				<!-- Log Header -->
				<div class="flex items-start gap-2">
					<!-- Level Badge -->
					<span
						:class="getLevelClass(log.level)"
						class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0"
					>
						{{ log.level }}
					</span>

					<!-- Timestamp -->
					<span class="text-gray-500 shrink-0 w-20">
						{{ formatTime(log.timestamp) }}
					</span>

					<!-- Message -->
					<div class="flex-1">
						<div :class="getLevelTextClass(log.level)">
							{{ log.message }}
						</div>

						<!-- Expanded Details -->
						<div
							v-if="expandedLogId === log.id"
							class="mt-2 space-y-2"
						>
							<!-- Request Details -->
							<div
								v-if="log.request"
								class="bg-gray-950 p-2 rounded"
							>
								<div class="text-blue-400 font-semibold mb-1">→ Request</div>
								<div class="text-gray-300">
									<div>
										<span class="text-gray-500">Method:</span>
										{{ log.request.method }}
									</div>
									<div>
										<span class="text-gray-500">URL:</span>
										{{ log.request.url }}
									</div>
									<div
										v-if="
											log.request.headers &&
											Object.keys(log.request.headers).length > 0
										"
										class="mt-1"
									>
										<span class="text-gray-500">Headers:</span>
										<pre class="text-[10px] mt-1 text-gray-400">{{
											formatJSON(log.request.headers)
										}}</pre>
									</div>
									<div
										v-if="log.request.body"
										class="mt-1"
									>
										<span class="text-gray-500">Body:</span>
										<pre class="text-[10px] mt-1 text-gray-400">{{
											formatJSON(log.request.body)
										}}</pre>
									</div>
								</div>
							</div>

							<!-- Response Details -->
							<div
								v-if="log.response"
								class="bg-gray-950 p-2 rounded"
							>
								<div class="text-green-400 font-semibold mb-1">← Response</div>
								<div class="text-gray-300">
									<div>
										<span class="text-gray-500">Status:</span>
										<span :class="getStatusColor(log.response.status)">
											{{ log.response.status }} {{ log.response.statusText }}
										</span>
									</div>
									<div>
										<span class="text-gray-500">Time:</span>
										{{ log.response.time }}ms
									</div>
									<div>
										<span class="text-gray-500">Size:</span>
										{{ formatSize(log.response.size) }}
									</div>
									<div
										v-if="
											log.response.headers &&
											Object.keys(log.response.headers).length > 0
										"
										class="mt-1"
									>
										<span class="text-gray-500">Headers:</span>
										<pre class="text-[10px] mt-1 text-gray-400">{{
											formatJSON(log.response.headers)
										}}</pre>
									</div>
									<div
										v-if="log.response.body"
										class="mt-1"
									>
										<span class="text-gray-500">Body:</span>
										<pre
											class="text-[10px] mt-1 text-gray-400 max-h-48 overflow-y-auto"
											>{{ formatJSON(log.response.body) }}</pre
										>
									</div>
								</div>
							</div>

							<!-- Additional Details -->
							<div
								v-if="log.details"
								class="bg-gray-950 p-2 rounded"
							>
								<div class="text-gray-400 font-semibold mb-1">Details</div>
								<pre class="text-[10px] text-gray-400">{{
									formatJSON(log.details)
								}}</pre>
							</div>
						</div>
					</div>

					<!-- Expand Icon -->
					<span class="text-gray-600 shrink-0">
						{{ expandedLogId === log.id ? '▼' : '▶' }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, h } from 'vue'
	import dayjs from 'dayjs'
	import { useConsoleStore } from '@/stores/console'
	import type { LogLevel } from '@/types/console'
	import type { DropdownOption } from 'naive-ui'

	const consoleStore = useConsoleStore()
	const expandedLogId = ref<string | null>(null)

	const logLevels: LogLevel[] = ['request', 'response', 'success', 'error', 'warning', 'info']

	const levelFilterOptions = computed<DropdownOption[]>(() => {
		const levelLabels: Record<LogLevel, string> = {
			info: 'Info',
			success: 'Success',
			warning: 'Warning',
			error: 'Error',
			request: 'Request',
			response: 'Response',
		}

		return logLevels.map(level => ({
			key: level,
			label: levelLabels[level],
			icon: () =>
				h('input', {
					type: 'checkbox',
					checked: isLevelActive(level),
					style: 'margin-right: 8px',
				}),
		}))
	})

	function handleLevelFilterSelect(key: string | number) {
		consoleStore.toggleLevel(key as LogLevel)
	}

	function isLevelActive(level: LogLevel): boolean {
		return consoleStore.filters.levels.includes(level)
	}

	function getLevelClass(level: LogLevel): string {
		const classes: Record<LogLevel, string> = {
			info: 'bg-blue-900 text-blue-200',
			success: 'bg-green-900 text-green-200',
			warning: 'bg-yellow-900 text-yellow-200',
			error: 'bg-red-900 text-red-200',
			request: 'bg-cyan-900 text-cyan-200',
			response: 'bg-purple-900 text-purple-200',
		}
		return classes[level]
	}

	function getLevelTextClass(level: LogLevel): string {
		const classes: Record<LogLevel, string> = {
			info: 'text-blue-300',
			success: 'text-green-300',
			warning: 'text-yellow-300',
			error: 'text-red-300',
			request: 'text-cyan-300',
			response: 'text-purple-300',
		}
		return classes[level]
	}

	function getStatusColor(status: number): string {
		if (status >= 200 && status < 300) return 'text-green-400'
		if (status >= 300 && status < 400) return 'text-blue-400'
		if (status >= 400 && status < 500) return 'text-yellow-400'
		if (status >= 500) return 'text-red-400'
		return 'text-gray-400'
	}

	function formatTime(timestamp: number): string {
		return dayjs(timestamp).format('HH:mm:ss.SSS')
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
	}

	function formatJSON(data: unknown): string {
		try {
			if (typeof data === 'string') return data
			return JSON.stringify(data, null, 2)
		} catch {
			return String(data)
		}
	}
</script>

<style scoped></style>
