<template>
	<n-dropdown
		:show="show"
		:x="x"
		:y="y"
		:options="menuOptions"
		placement="bottom-start"
		@select="handleSelect"
		@clickoutside="$emit('close')"
	/>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import { NDropdown } from 'naive-ui'
import { Icon } from '@iconify/vue'
import type { DropdownOption } from 'naive-ui'
import { TAB_GROUP_COLORS, getGroupColor } from '@/constants/tabGroups'
import type { TabGroup, RequestTab } from '@/types/request'

const props = defineProps<{
	show: boolean
	x: number
	y: number
	target: RequestTab | TabGroup | null
	targetType: 'tab' | 'group' | null
	allGroups: TabGroup[]
}>()

const emit = defineEmits<{
	close: []
	action: [action: string, payload?: any]
}>()

const isDark = computed(() =>
	document.documentElement.classList.contains('dark')
)

const menuOptions = computed<DropdownOption[]>(() => {
	if (props.targetType === 'tab' && props.target) {
		const tab = props.target as RequestTab
		const isInGroup = !!tab.groupId

		const options: DropdownOption[] = []

		if (isInGroup) {
			options.push({
				label: 'Remove from Group',
				key: 'remove-from-group',
				icon: () => h(Icon, { icon: 'mdi:folder-remove' }),
			})
		} else {
			options.push({
				label: 'Add to New Group',
				key: 'add-to-new-group',
				icon: () => h(Icon, { icon: 'mdi:folder-plus' }),
			})

			if (props.allGroups.length > 0) {
				options.push({
					type: 'divider',
					key: 'd1',
				})
				options.push({
					label: 'Add to Existing Group',
					key: 'add-to-existing',
					icon: () => h(Icon, { icon: 'mdi:folder-arrow-right' }),
					children: props.allGroups.map((g) => ({
						label: g.name,
						key: `add-to-group-${g.id}`,
						icon: () =>
							h('div', {
								style: {
									width: '12px',
									height: '12px',
									borderRadius: '50%',
									backgroundColor: getGroupColor(g.color, isDark.value),
								},
							}),
					})),
				})
			}
		}

		options.push(
			{ type: 'divider', key: 'd2' },
			{
				label: 'Close Tab',
				key: 'close-tab',
				icon: () => h(Icon, { icon: 'mdi:close' }),
			},
			{
				label: 'Close Other Tabs',
				key: 'close-other-tabs',
				icon: () => h(Icon, { icon: 'mdi:close-box-multiple' }),
			}
		)

		return options
	}

	if (props.targetType === 'group' && props.target) {
		const group = props.target as TabGroup

		return [
			{
				label: 'Rename Group',
				key: 'rename-group',
				icon: () => h(Icon, { icon: 'mdi:pencil' }),
			},
			{
				label: 'Change Color',
				key: 'change-color',
				icon: () => h(Icon, { icon: 'mdi:palette' }),
				children: TAB_GROUP_COLORS.map((c) => ({
					label: c.name.charAt(0).toUpperCase() + c.name.slice(1),
					key: `color-${c.name}`,
					icon: () =>
						h('div', {
							style: {
								width: '16px',
								height: '16px',
								borderRadius: '50%',
								backgroundColor: isDark.value ? c.dark : c.light,
							},
						}),
				})),
			},
			{
				label: group.isCollapsed ? 'Expand Group' : 'Collapse Group',
				key: 'toggle-collapse',
				icon: () =>
					h(Icon, {
						icon: group.isCollapsed
							? 'mdi:chevron-down'
							: 'mdi:chevron-right',
					}),
			},
			{ type: 'divider', key: 'd1' },
			{
				label: 'Ungroup Tabs',
				key: 'ungroup-tabs',
				icon: () => h(Icon, { icon: 'mdi:folder-open' }),
			},
			{
				label: 'Close Group',
				key: 'close-group',
				icon: () => h(Icon, { icon: 'mdi:close-circle' }),
			},
		]
	}

	return []
})

function handleSelect(key: string) {
	if (key.startsWith('add-to-group-')) {
		const groupId = key.replace('add-to-group-', '')
		emit('action', 'add-to-group', groupId)
	} else if (key.startsWith('color-')) {
		const color = key.replace('color-', '')
		emit('action', 'change-color', color)
	} else {
		emit('action', key)
	}
	emit('close')
}
</script>
