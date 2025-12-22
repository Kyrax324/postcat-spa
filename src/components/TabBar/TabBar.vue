<template>
	<div
		class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0"
	>
		<div class="flex items-center overflow-x-auto scrollbar-hide">
			<!-- Ungrouped tabs -->
			<TabItem
				v-for="tab in organizedTabs.ungrouped"
				:key="tab.id"
				:tab="tab"
				:is-active="activeTabId === tab.id"
				:show-close="tabs.length > 1"
				@click="$emit('select-tab', tab.id)"
				@close="$emit('close-tab', tab.id)"
				@context-menu="handleTabContextMenu(tab, $event)"
			/>

			<!-- Groups -->
			<TabGroup
				v-for="group in groups"
				:key="group.id"
				:group="group"
				:tabs="organizedTabs.grouped[group.id] || []"
				:is-active="(tabId: string) => activeTabId === tabId"
				:show-close="tabs.length > 1"
				@toggle-collapse="$emit('toggle-collapse', group.id)"
				@select-tab="$emit('select-tab', $event)"
				@close-tab="$emit('close-tab', $event)"
				@context-menu="handleGroupContextMenu(group, $event)"
				@tab-context-menu="handleTabContextMenu"
			/>

			<!-- New tab button -->
			<button
				class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
				@click="$emit('create-tab')"
			>
				<Icon
					icon="mdi:plus"
					:width="18"
					:height="18"
				/>
			</button>
		</div>

		<!-- Context Menu -->
		<TabContextMenu
			:show="contextMenu.show"
			:x="contextMenu.x"
			:y="contextMenu.y"
			:target="contextMenu.target"
			:target-type="contextMenu.targetType"
			:all-groups="groups"
			@close="closeContextMenu"
			@action="handleContextAction"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import TabItem from './TabItem.vue'
import TabGroup from './TabGroup.vue'
import TabContextMenu from './TabContextMenu.vue'
import type {
	RequestTab,
	TabGroup as TabGroupType,
	TabGroupColor,
} from '@/types/request'

defineProps<{
	tabs: RequestTab[]
	groups: TabGroupType[]
	organizedTabs: {
		ungrouped: RequestTab[]
		grouped: Record<string, RequestTab[]>
	}
	activeTabId: string
}>()

const emit = defineEmits<{
	'select-tab': [tabId: string]
	'close-tab': [tabId: string]
	'create-tab': []
	'toggle-collapse': [groupId: string]
	'create-group': [tabId: string]
	'rename-group': [groupId: string]
	'delete-group': [groupId: string, mode: 'ungroup' | 'close-tabs']
	'change-group-color': [groupId: string, color: TabGroupColor]
	'add-to-group': [tabId: string, groupId: string]
	'remove-from-group': [tabId: string]
	'close-other-tabs': [tabId: string]
}>()

const contextMenu = ref<{
	show: boolean
	x: number
	y: number
	target: RequestTab | TabGroupType | null
	targetType: 'tab' | 'group' | null
}>({
	show: false,
	x: 0,
	y: 0,
	target: null,
	targetType: null,
})

function handleTabContextMenu(tab: RequestTab, e: MouseEvent) {
	contextMenu.value = {
		show: true,
		x: e.clientX,
		y: e.clientY,
		target: tab,
		targetType: 'tab',
	}
}

function handleGroupContextMenu(group: TabGroupType, e: MouseEvent) {
	contextMenu.value = {
		show: true,
		x: e.clientX,
		y: e.clientY,
		target: group,
		targetType: 'group',
	}
}

function closeContextMenu() {
	contextMenu.value.show = false
}

function handleContextAction(action: string, payload?: any) {
	const { target, targetType } = contextMenu.value

	if (targetType === 'tab' && target) {
		const tab = target as RequestTab
		switch (action) {
			case 'add-to-new-group':
				emit('create-group', tab.id)
				break
			case 'add-to-group':
				emit('add-to-group', tab.id, payload)
				break
			case 'remove-from-group':
				emit('remove-from-group', tab.id)
				break
			case 'close-tab':
				emit('close-tab', tab.id)
				break
			case 'close-other-tabs':
				emit('close-other-tabs', tab.id)
				break
		}
	}

	if (targetType === 'group' && target) {
		const group = target as TabGroupType
		switch (action) {
			case 'rename-group':
				emit('rename-group', group.id)
				break
			case 'change-color':
				emit('change-group-color', group.id, payload)
				break
			case 'toggle-collapse':
				emit('toggle-collapse', group.id)
				break
			case 'ungroup-tabs':
				emit('delete-group', group.id, 'ungroup')
				break
			case 'close-group':
				emit('delete-group', group.id, 'close-tabs')
				break
		}
	}
}
</script>
