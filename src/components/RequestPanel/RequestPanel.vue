<template>
	<div class="h-full flex flex-col bg-white dark:bg-gray-800">
		<!-- URL Bar -->
		<div
			v-if="!hideUrlBar"
			class="p-4 border-b border-gray-200 dark:border-gray-700"
		>
			<div class="flex gap-2">
				<VariableInput
					v-model="requestStore.currentRequest.url"
					placeholder="Enter request URL..."
					size="large"
					class="flex-1"
				>
				</VariableInput>
				<n-button
					type="primary"
					size="large"
					:loading="requestStore.isLoading"
					:disabled="!requestStore.currentRequest.url"
					@click="handleSendRequest"
				>
					Send
				</n-button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex-1 overflow-hidden">
			<n-tabs
				type="line"
				class="h-full"
				:tab-style="{ padding: '12px 16px' }"
			>
				<n-tab-pane
					name="params"
					tab="Query Params"
				>
					<div class="p-4 space-y-2 overflow-y-auto h-full">
						<div
							v-if="requestStore.currentRequest.queryParams.length > 0"
							class="flex justify-end mb-2"
						>
							<n-button
								size="small"
								@click="toggleAllQueryParams"
							>
								{{ allQueryParamsEnabled ? 'Unselect All' : 'Select All' }}
							</n-button>
						</div>
						<div
							v-for="(param, index) in requestStore.currentRequest.queryParams"
							:key="index"
							class="flex gap-2 items-center"
						>
							<n-checkbox v-model:checked="param.enabled" />
							<n-input
								v-model:value="param.key"
								placeholder="Key"
								size="small"
								class="flex-1"
								@update:value="onQueryParamChange(param)"
							/>
							<n-input
								v-model:value="param.value"
								placeholder="Value"
								size="small"
								class="flex-1"
								@update:value="onQueryParamChange(param)"
							/>
							<n-button
								text
								@click="removeQueryParam(index)"
							>
								🗑️
							</n-button>
						</div>
						<n-button
							text
							class="w-full"
							@click="addQueryParam"
						>
							+ Add Query Param
						</n-button>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="headers"
					tab="Headers"
				>
					<div class="p-4 space-y-2 overflow-y-auto h-full">
						<div
							v-if="requestStore.currentRequest.headers.length > 0"
							class="flex justify-end mb-2"
						>
							<n-button
								size="small"
								@click="toggleAllHeaders"
							>
								{{ allHeadersEnabled ? 'Unselect All' : 'Select All' }}
							</n-button>
						</div>
						<div
							v-for="(header, index) in requestStore.currentRequest.headers"
							:key="index"
							class="flex gap-2 items-center"
						>
							<n-checkbox v-model:checked="header.enabled" />
							<n-input
								v-model:value="header.key"
								placeholder="Key"
								size="small"
								class="flex-1"
								@update:value="onHeaderChange(header)"
							/>
							<n-input
								v-model:value="header.value"
								placeholder="Value"
								size="small"
								class="flex-1"
								@update:value="onHeaderChange(header)"
							/>
							<n-button
								text
								@click="removeHeader(index)"
							>
								🗑️
							</n-button>
						</div>
						<n-button
							text
							class="w-full"
							@click="addHeader"
						>
							+ Add Header
						</n-button>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="body"
					tab="Body"
					:disabled="!hasBody"
				>
					<div class="h-full flex flex-col">
						<div class="p-4 border-b border-gray-200 dark:border-gray-700">
							<n-radio-group
								v-model:value="requestStore.currentRequest.bodyType"
								size="small"
							>
								<n-radio-button value="json"> JSON </n-radio-button>
								<n-radio-button value="raw"> Raw </n-radio-button>
								<n-radio-button value="none"> None </n-radio-button>
							</n-radio-group>
						</div>
						<div
							v-if="requestStore.currentRequest.bodyType !== 'none'"
							class="flex-1 p-4"
						>
							<n-input
								v-model:value="requestStore.currentRequest.body"
								type="textarea"
								placeholder="Request body..."
								:autosize="{ minRows: 10, maxRows: 20 }"
								:input-props="{ style: 'font-family: monospace' }"
							/>
						</div>
					</div>
				</n-tab-pane>
			</n-tabs>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, h, ref } from 'vue'
	import { useMessage } from 'naive-ui'
	import { useRequestStore } from '@/stores/request'
	import { useRequestExecutor } from '@/composables/useRequestExecutor'
	import type { QueryParam, HttpHeader } from '@/types/request'
	import VariableInput from '@/components/VariableInput.vue'
	import RichPillInput from '../RichPillInput.vue'

	defineProps<{
		hideUrlBar?: boolean
	}>()

	const message = useMessage()
	const requestStore = useRequestStore()
	const { executeRequest } = useRequestExecutor()

	const getMethodColor = (method: string): string => {
		const colors: Record<string, string> = {
			GET: '#10b981',
			POST: '#eab308',
			PUT: '#3b82f6',
			PATCH: '#a855f7',
			DELETE: '#ef4444',
			HEAD: '#14b8a6',
			OPTIONS: '#6366f1',
		}
		return colors[method] || '#6b7280'
	}

	const methodOptions = [
		{ label: 'GET', value: 'GET' },
		{ label: 'POST', value: 'POST' },
		{ label: 'PUT', value: 'PUT' },
		{ label: 'PATCH', value: 'PATCH' },
		{ label: 'DELETE', value: 'DELETE' },
		{ label: 'HEAD', value: 'HEAD' },
		{ label: 'OPTIONS', value: 'OPTIONS' },
	]

	const renderMethodLabel = (option: { label: string; value: string }) => {
		return h(
			'span',
			{
				style: {
					color: getMethodColor(option.value),
					fontWeight: '600',
					fontFamily: 'monospace',
				},
			},
			option.label
		)
	}

	const hasBody = computed(() => {
		const method = requestStore.currentRequest.method
		return method !== 'GET' && method !== 'HEAD'
	})

	const allQueryParamsEnabled = computed(() => {
		return (
			requestStore.currentRequest.queryParams.length > 0 &&
			requestStore.currentRequest.queryParams.every(p => p.enabled)
		)
	})

	const allHeadersEnabled = computed(() => {
		return (
			requestStore.currentRequest.headers.length > 0 &&
			requestStore.currentRequest.headers.every(h => h.enabled)
		)
	})

	function addQueryParam() {
		requestStore.currentRequest.queryParams.push({
			key: '',
			value: '',
			enabled: true,
		})
	}

	function removeQueryParam(index: number) {
		requestStore.currentRequest.queryParams.splice(index, 1)
	}

	function addHeader() {
		requestStore.currentRequest.headers.push({
			key: '',
			value: '',
			enabled: true,
		})
	}

	function removeHeader(index: number) {
		requestStore.currentRequest.headers.splice(index, 1)
	}

	function toggleAllQueryParams() {
		const newState = !allQueryParamsEnabled.value
		requestStore.currentRequest.queryParams.forEach(param => {
			param.enabled = newState
		})
	}

	function toggleAllHeaders() {
		const newState = !allHeadersEnabled.value
		requestStore.currentRequest.headers.forEach(header => {
			header.enabled = newState
		})
	}

	function onQueryParamChange(param: QueryParam) {
		if ((param.key.trim() || param.value.trim()) && !param.enabled) {
			param.enabled = true
		}
	}

	function onHeaderChange(header: HttpHeader) {
		if ((header.key.trim() || header.value.trim()) && !header.enabled) {
			header.enabled = true
		}
	}

	async function handleSendRequest() {
		try {
			await executeRequest()
			message.success('Request completed')
		} catch (error) {
			message.error(error instanceof Error ? error.message : 'Request failed')
		}
	}
</script>

<style scoped></style>
