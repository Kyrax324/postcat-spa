<template>
	<n-modal
		v-model:show="isVisible"
		preset="dialog"
		:title="mode === 'create' ? 'Create Group' : 'Rename Group'"
		:positive-text="mode === 'create' ? 'Create' : 'Save'"
		negative-text="Cancel"
		@positive-click="handleConfirm"
		@negative-click="handleCancel"
	>
		<div class="space-y-4">
			<!-- Group Name Input -->
			<div>
				<label class="block text-sm font-medium mb-2">Group Name</label>
				<n-input
					v-model:value="groupName"
					placeholder="Enter group name"
					@keyup.enter="handleConfirm"
				/>
			</div>

			<!-- Color Picker -->
			<div>
				<label class="block text-sm font-medium mb-2">Color</label>
				<div class="flex gap-2 flex-wrap">
					<button
						v-for="colorConfig in TAB_GROUP_COLORS"
						:key="colorConfig.name"
						class="w-10 h-10 rounded-full border-2 transition-all hover:scale-110"
						:class="{
							'border-gray-900 dark:border-white': selectedColor === colorConfig.name,
							'border-transparent': selectedColor !== colorConfig.name,
						}"
						:style="{ backgroundColor: isDark ? colorConfig.dark : colorConfig.light }"
						:title="colorConfig.name"
						@click="selectedColor = colorConfig.name"
					></button>
				</div>
			</div>
		</div>
	</n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NInput } from 'naive-ui'
import { TAB_GROUP_COLORS } from '@/constants/tabGroups'
import type { TabGroupColor } from '@/types/request'

const props = defineProps<{
	show: boolean
	mode: 'create' | 'rename'
	initialName?: string
	initialColor?: TabGroupColor
}>()

const emit = defineEmits<{
	'update:show': [value: boolean]
	confirm: [name: string, color: TabGroupColor]
	cancel: []
}>()

const isVisible = computed({
	get: () => props.show,
	set: (value) => emit('update:show', value),
})

const groupName = ref('')
const selectedColor = ref<TabGroupColor>('blue')

const isDark = computed(() =>
	document.documentElement.classList.contains('dark')
)

// Initialize values when dialog opens
watch(
	() => props.show,
	(show) => {
		if (show) {
			groupName.value = props.initialName || ''
			selectedColor.value = props.initialColor || 'blue'
		}
	}
)

function handleConfirm() {
	if (groupName.value.trim()) {
		emit('confirm', groupName.value.trim(), selectedColor.value)
		isVisible.value = false
	}
}

function handleCancel() {
	emit('cancel')
	isVisible.value = false
}
</script>
