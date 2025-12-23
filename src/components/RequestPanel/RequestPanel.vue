<template>
	<div class="h-full flex flex-col">
		<!-- URL Bar -->
		<div
			v-if="!hideUrlBar"
			class="p-5 border-b apple-divider"
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
				:tab-style="{ padding: '14px 20px', fontWeight: '500' }"
			>
				<n-tab-pane
					name="params"
					tab="Query Params"
				>
					<div class="p-5 space-y-3 overflow-y-auto scrollbar-thin h-full">
						<div
							v-if="requestStore.currentRequest.queryParams.length > 0"
							class="flex justify-end mb-3"
						>
							<n-button
								size="small"
								secondary
								@click="toggleAllQueryParams"
							>
								{{ allQueryParamsEnabled ? 'Unselect All' : 'Select All' }}
							</n-button>
						</div>
						<div
							v-for="(param, index) in requestStore.currentRequest.queryParams"
							:key="index"
							class="flex gap-3 items-center p-3 rounded-apple bg-apple-gray-50/50 dark:bg-apple-gray-800/30 hover:bg-apple-gray-100/80 dark:hover:bg-apple-gray-700/40 transition-colors"
						>
							<n-checkbox v-model:checked="param.enabled" />
							<n-input
								v-model:value="param.key"
								placeholder="Parameter name"
								size="medium"
								class="flex-1 rounded-apple"
								@update:value="onQueryParamChange(param)"
							/>
							<n-input
								v-model:value="param.value"
								placeholder="Value"
								size="medium"
								class="flex-1 rounded-apple"
								@update:value="onQueryParamChange(param)"
							/>
							<n-button
								text
								@click="removeQueryParam(index)"
							>
								<Icon
									icon="mdi:delete-outline"
									class="w-5 h-5 text-red-500"
								/>
							</n-button>
						</div>
						<n-button
							text
							class="w-full rounded-apple mt-2 py-3"
							@click="addQueryParam"
						>
							<template #icon>
								<Icon
									icon="mdi:plus"
									class="w-4 h-4"
								/>
							</template>
							Add Query Param
						</n-button>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="headers"
					tab="Headers"
				>
					<div class="p-5 space-y-3 overflow-y-auto scrollbar-thin h-full">
						<div
							v-if="requestStore.currentRequest.headers.length > 0"
							class="flex justify-end mb-3"
						>
							<n-button
								size="small"
								secondary
								@click="toggleAllHeaders"
							>
								{{ allHeadersEnabled ? 'Unselect All' : 'Select All' }}
							</n-button>
						</div>
						<div
							v-for="(header, index) in requestStore.currentRequest.headers"
							:key="index"
							class="flex gap-3 items-center p-3 rounded-apple bg-apple-gray-50/50 dark:bg-apple-gray-800/30 hover:bg-apple-gray-100/80 dark:hover:bg-apple-gray-700/40 transition-colors"
						>
							<n-checkbox v-model:checked="header.enabled" />
							<n-input
								v-model:value="header.key"
								placeholder="Header name"
								size="medium"
								class="flex-1 rounded-apple"
								@update:value="onHeaderChange(header)"
							/>
							<n-input
								v-model:value="header.value"
								placeholder="Value"
								size="medium"
								class="flex-1 rounded-apple"
								@update:value="onHeaderChange(header)"
							/>
							<n-button
								text
								@click="removeHeader(index)"
							>
								<Icon
									icon="mdi:delete-outline"
									class="w-5 h-5 text-red-500"
								/>
							</n-button>
						</div>
						<n-button
							text
							class="w-full rounded-apple mt-2 py-3"
							@click="addHeader"
						>
							<template #icon>
								<Icon
									icon="mdi:plus"
									class="w-4 h-4"
								/>
							</template>
							Add Header
						</n-button>
					</div>
				</n-tab-pane>

				<n-tab-pane
					name="body"
					tab="Body"
					:disabled="!hasBody"
				>
					<div class="h-full flex flex-col">
						<div class="p-5 border-b apple-divider">
							<n-radio-group
								v-model:value="requestStore.currentRequest.bodyType"
								size="medium"
							>
								<n-radio-button
									value="json"
									class="rounded-l-apple"
								>
									JSON
								</n-radio-button>
								<n-radio-button value="raw">
									Raw
								</n-radio-button>
								<n-radio-button
									value="none"
									class="rounded-r-apple"
								>
									None
								</n-radio-button>
							</n-radio-group>
						</div>
						<div
							v-if="requestStore.currentRequest.bodyType !== 'none'"
							class="flex-1 p-5"
						>
							<n-input
								v-model:value="requestStore.currentRequest.body"
								type="textarea"
								placeholder="Request body..."
								:autosize="{ minRows: 12, maxRows: 24 }"
								:input-props="{ style: 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6;' }"
								class="rounded-apple"
							/>
						</div>
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
	import { useRequestExecutor } from '@/composables/useRequestExecutor'
	import type { QueryParam, HttpHeader } from '@/types/request'
	import VariableInput from '@/components/VariableInput.vue'

	defineProps<{
		hideUrlBar?: boolean
	}>()

	const message = useMessage()
	const requestStore = useRequestStore()
	const { executeRequest } = useRequestExecutor()

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
