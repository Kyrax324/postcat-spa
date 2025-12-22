<template>
	<div class="relative w-full">
		<n-input
			ref="inputRef"
			:value="modelValue"
			v-bind="$attrs"
			@input="handleInput"
			@keydown="handleKeydown"
		>
			<template
				v-if="$slots.prefix"
				#prefix
			>
				<slot name="prefix" />
			</template>
		</n-input>

		<!-- Variable Picker Popover -->
		<div
			v-if="showVariablePicker"
			class="absolute z-50 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
			:style="popoverStyle"
		>
			<div class="p-2 border-b border-gray-200 dark:border-gray-700">
				<p class="text-xs font-medium text-gray-700 dark:text-gray-300">
					Select Variable
				</p>
			</div>
			<div class="max-h-64 overflow-y-auto">
				<div
					v-if="filteredVariables.length === 0"
					class="p-4 text-center text-sm text-gray-500"
				>
					No variables found
				</div>
				<div
					v-for="(variable, index) in filteredVariables"
					:key="variable.key"
					class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
					:class="{
						'bg-gray-100 dark:bg-gray-700': index === selectedIndex,
						'opacity-50': !variable.enabled,
					}"
					@click="selectVariable(variable.key)"
					@mouseenter="selectedIndex = index"
				>
					<div class="flex items-center justify-between">
						<div class="flex-1 min-w-0">
							<code class="text-xs text-red-600 dark:text-red-400 font-mono">
								{{ variable.key }}
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
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, watch, nextTick } from 'vue'
	import { useVariablesStore } from '@/stores/variables'

	const props = defineProps<{
		modelValue: string
	}>()

	const emit = defineEmits<{
		'update:modelValue': [value: string]
	}>()

	const variablesStore = useVariablesStore()
	const inputRef = ref()
	const showVariablePicker = ref(false)
	const cursorPosition = ref(0)
	const variableStartPos = ref(0)
	const searchQuery = ref('')
	const selectedIndex = ref(0)
	const popoverStyle = ref({})

	const filteredVariables = computed(() => {
		if (!searchQuery.value) {
			return variablesStore.variables
		}
		return variablesStore.variables.filter(v =>
			v.key.toLowerCase().includes(searchQuery.value.toLowerCase())
		)
	})

	watch(filteredVariables, () => {
		selectedIndex.value = 0
	})

	function handleInput(value: string | Event) {
		// Handle both direct value and input event
		const inputValue = typeof value === 'string' ? value : (value.target as HTMLInputElement).value
		console.log('handleInput called, value:', inputValue)

		emit('update:modelValue', inputValue)

		const input = inputRef.value?.inputElRef as HTMLInputElement
		if (!input) {
			console.log('No input ref found')
			return
		}

		cursorPosition.value = input.selectionStart || 0
		console.log('Cursor position:', cursorPosition.value)

		// Check if user is typing {{
		const textBeforeCursor = inputValue.substring(0, cursorPosition.value)
		const lastDoubleBrace = textBeforeCursor.lastIndexOf('{{')
		console.log('Last {{ found at:', lastDoubleBrace)

		if (lastDoubleBrace !== -1) {
			const textAfterBrace = textBeforeCursor.substring(lastDoubleBrace + 2)
			const hasClosingBrace = inputValue.substring(cursorPosition.value).startsWith('}}')

			console.log('Text after brace:', textAfterBrace, 'Has closing:', hasClosingBrace)

			// Show picker if we found {{ and no closing }} yet
			if (!textAfterBrace.includes('}}') && !hasClosingBrace) {
				variableStartPos.value = lastDoubleBrace
				searchQuery.value = textAfterBrace
				showVariablePicker.value = true
				console.log('Showing variable picker')
				updatePopoverPosition()
			} else {
				showVariablePicker.value = false
			}
		} else {
			showVariablePicker.value = false
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showVariablePicker.value) return

		if (event.key === 'ArrowDown') {
			event.preventDefault()
			selectedIndex.value = Math.min(
				selectedIndex.value + 1,
				filteredVariables.value.length - 1
			)
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
		} else if (event.key === 'Enter' || event.key === 'Tab') {
			if (filteredVariables.value.length > 0) {
				event.preventDefault()
				selectVariable(filteredVariables.value[selectedIndex.value].key)
			}
		} else if (event.key === 'Escape') {
			showVariablePicker.value = false
		}
	}

	function selectVariable(key: string) {
		const input = inputRef.value?.inputElRef as HTMLInputElement
		if (!input) return

		const before = props.modelValue.substring(0, variableStartPos.value)
		const after = props.modelValue.substring(cursorPosition.value)

		const newValue = `${before}{{${key}}}${after}`
		emit('update:modelValue', newValue)

		showVariablePicker.value = false

		// Move cursor after the inserted variable
		nextTick(() => {
			const newCursorPos = variableStartPos.value + key.length + 4 // {{key}}
			input.setSelectionRange(newCursorPos, newCursorPos)
			input.focus()
		})
	}

	function updatePopoverPosition() {
		nextTick(() => {
			popoverStyle.value = {
				top: '100%',
				left: '0',
			}
		})
	}
</script>
