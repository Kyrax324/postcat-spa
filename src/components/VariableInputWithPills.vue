<template>
	<div class="relative w-full">
		<!-- Visual Display with Pills -->
		<div
			ref="displayRef"
			class="n-input n-input--large flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-text flex-wrap min-h-[40px] pointer-events-none"
			:class="{ 'border-primary-500': isFocused }"
		>
			<!-- Prefix slot -->
			<span v-if="$slots.prefix">
				<slot name="prefix" />
			</span>

			<!-- Render text parts and variable pills -->
			<template
				v-for="(part, index) in parsedParts"
				:key="index"
			>
				<span
					v-if="part.type === 'text'"
					class="whitespace-pre text-gray-600 dark:text-gray-200"
				>
					{{ part.value }}
				</span>
				<n-tooltip
					v-else
					trigger="hover"
				>
					<template #trigger>
						<span
							class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium text-rose-600 dark:text-rose-700 border border-rose-700/50 cursor-help pointer-events-auto"
						>
							<span v-pre>{{</span>
							<span>{{ part.variableName }}</span>
							<span v-pre>}}</span>
						</span>
					</template>
					<div class="text-xs">
						<div class="font-semibold">{{ part.variableName }}</div>
						<div class="text-gray-400 mt-1">
							{{ getVariableValue(part.variableName) || '(empty)' }}
						</div>
					</div>
				</n-tooltip>
			</template>

			<!-- Cursor placeholder -->
			<span
				v-if="!modelValue"
				class="text-gray-400"
			>
				{{ placeholder }}
			</span>
		</div>

		<!-- Transparent overlay input for editing -->
		<input
			ref="hiddenInputRef"
			v-bind="$attrs"
			type="text"
			:value="modelValue"
			class="absolute inset-0 w-full h-full py-2 bg-transparent border-0 outline-none text-transparent"
			:style="{
				caretColor: 'rgb(31, 41, 55)',
				paddingLeft: $slots.prefix ? '52px' : '12px',
				paddingRight: '12px',
			}"
			@input="handleInput"
			@focus="isFocused = true"
			@blur="handleBlur"
			@keydown="handleKeydown"
		/>

		<!-- Variable Picker Popover -->
		<div
			v-if="showVariablePicker"
			class="absolute z-50 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
			:style="popoverStyle"
		>
			<div class="p-2 border-b border-gray-200 dark:border-gray-700">
				<p class="text-xs font-medium text-gray-700 dark:text-gray-300">Select Variable</p>
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

	type ParsedPart =
		| {
				type: 'text'
				value: string
		  }
		| {
				type: 'variable'
				value: string
				variableName: string
		  }

	const props = defineProps<{
		modelValue: string
		placeholder?: string
	}>()

	const emit = defineEmits<{
		'update:modelValue': [value: string]
	}>()

	const variablesStore = useVariablesStore()
	const hiddenInputRef = ref<HTMLInputElement>()
	const displayRef = ref<HTMLDivElement>()
	const isFocused = ref(false)
	const showVariablePicker = ref(false)
	const cursorPosition = ref(0)
	const variableStartPos = ref(0)
	const searchQuery = ref('')
	const selectedIndex = ref(0)
	const popoverStyle = ref({})

	// Parse the input value into text and variable parts
	const parsedParts = computed(() => {
		const parts: ParsedPart[] = []
		const value = props.modelValue || ''
		let lastIndex = 0

		// Find all {{variable}} patterns
		const regex = /\{\{([^}]+)\}\}/g
		let match

		while ((match = regex.exec(value)) !== null) {
			// Add text before the variable
			if (match.index > lastIndex) {
				parts.push({
					type: 'text',
					value: value.substring(lastIndex, match.index),
				})
			}

			// Add the variable
			parts.push({
				type: 'variable',
				value: match[0],
				variableName: match[1].trim(),
			})

			lastIndex = match.index + match[0].length
		}

		// Add remaining text
		if (lastIndex < value.length) {
			parts.push({
				type: 'text',
				value: value.substring(lastIndex),
			})
		}

		return parts
	})

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

	function getVariableValue(key: string): string | undefined {
		return variablesStore.getVariableValue(key)
	}

	function handleBlur() {
		// Delay to allow click on dropdown
		setTimeout(() => {
			isFocused.value = false
			showVariablePicker.value = false
		}, 200)
	}

	function handleInput(event: Event) {
		const inputValue = (event.target as HTMLInputElement).value
		emit('update:modelValue', inputValue)

		const input = hiddenInputRef.value
		if (!input) return

		cursorPosition.value = input.selectionStart || 0

		// Check if user is typing {{
		const textBeforeCursor = inputValue.substring(0, cursorPosition.value)
		const lastDoubleBrace = textBeforeCursor.lastIndexOf('{{')

		if (lastDoubleBrace !== -1) {
			const textAfterBrace = textBeforeCursor.substring(lastDoubleBrace + 2)
			const hasClosingBrace = inputValue.substring(cursorPosition.value).startsWith('}}')

			// Show picker if we found {{ and no closing }} yet
			if (!textAfterBrace.includes('}}') && !hasClosingBrace) {
				variableStartPos.value = lastDoubleBrace
				searchQuery.value = textAfterBrace
				showVariablePicker.value = true
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
		const input = hiddenInputRef.value
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

<style scoped>
	.n-input {
		font-family: inherit;
		font-size: 14px;
	}
</style>
