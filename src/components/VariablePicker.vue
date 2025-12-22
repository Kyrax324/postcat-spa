<template>
	<n-popover
		trigger="click"
		placement="bottom-start"
		:show-arrow="false"
	>
		<template #trigger>
			<n-button
				text
				size="small"
				class="text-gray-500 hover:text-primary-500"
			>
				<template #icon>
					<Icon icon="mdi:code-braces" />
				</template>
			</n-button>
		</template>
		<div class="w-80">
			<div class="p-2 border-b border-gray-200 dark:border-gray-700">
				<p class="text-xs font-medium text-gray-700 dark:text-gray-300">
					Insert Variable
				</p>
			</div>
			<div class="max-h-64 overflow-y-auto">
				<div
					v-if="allVariables.length === 0"
					class="p-4 text-center text-sm text-gray-500"
				>
					No variables defined. Add variables in the Variables section.
				</div>
				<div
					v-for="variable in allVariables"
					:key="variable.key"
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
					:class="{ 'opacity-50': !variable.enabled }"
					@click="insertVariable(variable.key)"
				>
					<div class="flex items-center justify-between">
						<div class="flex-1 min-w-0">
							<code class="text-xs text-red-600 dark:text-red-400 font-mono">
								&#123;&#123;{{ variable.key }}&#125;&#125;
							</code>
							<p
								v-if="variable.description"
								class="text-xs text-gray-500 truncate mt-0.5"
							>
								{{ variable.description }}
							</p>
						</div>
						<div class="text-xs text-gray-400 ml-2 font-mono truncate max-w-[120px]">
							{{ variable.value || '(empty)' }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</n-popover>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { Icon } from '@iconify/vue'
	import { useVariablesStore } from '@/stores/variables'

	const emit = defineEmits<{
		insert: [value: string]
	}>()

	const variablesStore = useVariablesStore()

	const allVariables = computed(() => {
		return variablesStore.variables
	})

	function insertVariable(key: string) {
		emit('insert', `{{${key}}}`)
	}
</script>
