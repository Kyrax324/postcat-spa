<template>
	<div
		class="tab-group inline-flex items-center"
		:style="{ borderLeft: `3px solid ${groupColor}` }"
	>
		<!-- Group Header -->
		<div
			class="group-header flex items-center gap-1 px-2 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
			@click="$emit('toggle-collapse')"
			@contextmenu.prevent="$emit('context-menu', $event)"
		>
			<!-- Color Badge -->
			<div
				class="w-3 h-3 rounded-full flex-shrink-0"
				:style="{ backgroundColor: groupColor }"
			></div>

			<!-- Group Name -->
			<span class="text-sm font-medium truncate max-w-[100px]">{{
				group.name
			}}</span>

			<!-- Collapse Icon -->
			<Icon
				:icon="
					group.isCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'
				"
				:width="16"
				:height="16"
			/>

			<!-- Tab Count Badge (when collapsed) -->
			<n-badge
				v-if="group.isCollapsed"
				:value="tabs.length"
				:max="99"
				type="info"
				size="small"
			/>
		</div>

		<!-- Tabs (when expanded) -->
		<div
			v-if="!group.isCollapsed"
			class="flex items-center"
		>
			<TabItem
				v-for="tab in tabs"
				:key="tab.id"
				:tab="tab"
				:is-active="isActive(tab.id)"
				:show-close="showClose"
				@click="$emit('select-tab', tab.id)"
				@close="$emit('close-tab', tab.id)"
				@context-menu="$emit('tab-context-menu', tab, $event)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NBadge } from 'naive-ui'
import { getGroupColor } from '@/constants/tabGroups'
import TabItem from './TabItem.vue'
import type { TabGroup, RequestTab } from '@/types/request'

const props = defineProps<{
	group: TabGroup
	tabs: RequestTab[]
	isActive: (tabId: string) => boolean
	showClose: boolean
}>()

defineEmits<{
	'toggle-collapse': []
	'select-tab': [tabId: string]
	'close-tab': [tabId: string]
	'context-menu': [event: MouseEvent]
	'tab-context-menu': [tab: RequestTab, event: MouseEvent]
}>()

// Detect dark mode
const isDark = computed(() =>
	document.documentElement.classList.contains('dark')
)
const groupColor = computed(() => getGroupColor(props.group.color, isDark.value))
</script>
