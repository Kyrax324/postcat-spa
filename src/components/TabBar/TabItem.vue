<template>
	<div
		class="flex items-center gap-2 px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group min-w-[120px] max-w-[200px] relative"
		:class="{
			'text-gray-900 dark:text-white': isActive,
			'text-gray-600 dark:text-gray-400': !isActive,
		}"
		@click="$emit('click')"
		@contextmenu.prevent="$emit('context-menu', $event)"
	>
		<span class="text-sm truncate flex-1">{{ tab.name }}</span>
		<button
			v-if="showClose"
			class="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity"
			@click.stop="$emit('close')"
		>
			✕
		</button>
		<div
			v-if="isActive"
			class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
		/>
	</div>
</template>

<script setup lang="ts">
import type { RequestTab } from '@/types/request'

defineProps<{
	tab: RequestTab
	isActive: boolean
	showClose: boolean
}>()

defineEmits<{
	click: []
	close: []
	'context-menu': [event: MouseEvent]
}>()
</script>
