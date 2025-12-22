<template>
	<div
		class="rich-pill-input-container"
		:class="{ 'is-focused': isFocused }"
	>
		<div
			ref="inputContainerRef"
			class="rich-pill-input"
			contenteditable="true"
			role="textbox"
			:aria-label="ariaLabel"
			:aria-describedby="ariaDescribedBy"
			@input="handleInput"
			@keydown="handleKeydown"
			@focus="handleFocus"
			@blur="handleBlur"
			@paste="handlePaste"
			@mousemove="handleMouseMove"
			@mouseleave="handleMouseLeave"
		>
			<span
				v-if="!hasTextContent"
				class="placeholder"
			>
				{{ placeholder }}
			</span>
		</div>

		<!-- Variable Value Tooltip -->
		<div
			v-if="showTooltip"
			ref="tooltipRef"
			class="variable-tooltip"
			:style="tooltipPosition"
		>
			<div class="tooltip-header">
				<span class="tooltip-variable">{{ tooltipData.name }}</span>
			</div>
			<div class="tooltip-value">
				<span class="tooltip-label">Value:</span>
				<span class="tooltip-value-text">{{ tooltipData.value || '(not set)' }}</span>
			</div>
			<div
				v-if="tooltipData.description"
				class="tooltip-description"
			>
				{{ tooltipData.description }}
			</div>
		</div>

		<!-- Variable Autocomplete Dropdown -->
		<div
			v-if="showAutocomplete && filteredSuggestions.length > 0"
			ref="autocompleteRef"
			class="autocomplete-dropdown"
			role="listbox"
		>
			<div
				v-for="(suggestion, index) in filteredSuggestions"
				:key="index"
				class="autocomplete-item"
				:class="{ 'is-selected': index === selectedSuggestionIndex }"
				role="option"
				:aria-selected="index === selectedSuggestionIndex"
				@click="selectSuggestion(suggestion)"
				@mouseenter="selectedSuggestionIndex = index"
			>
				<span class="suggestion-variable">&#123;&#123;{{ suggestion.key }}&#125;&#125;</span>
				<span
					v-if="suggestion.description"
					class="suggestion-description"
				>{{ suggestion.description }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

	interface Suggestion {
		key: string
		value?: string
		description?: string
	}

	interface Props {
		modelValue?: string
		placeholder?: string
		ariaLabel?: string
		ariaDescribedBy?: string
		suggestions?: Suggestion[]
	}

	const props = withDefaults(defineProps<Props>(), {
		modelValue: '',
		placeholder: 'Enter text with variables {{variableName}}',
		ariaLabel: 'Text input',
		suggestions: () => [],
	})

	const emit = defineEmits<{
		'update:modelValue': [value: string]
	}>()

	const inputContainerRef = ref<HTMLDivElement>()
	const autocompleteRef = ref<HTMLDivElement>()
	const isFocused = ref(false)
	const hasTextContent = ref(false)
	const showAutocomplete = ref(false)
	const selectedSuggestionIndex = ref(0)
	const currentCursorPosition = ref(0)
	const triggerPosition = ref(-1)
	const showTooltip = ref(false)
	const tooltipData = ref({
		name: '',
		value: '',
		description: ''
	})
	const tooltipPosition = ref({
		top: '0px',
		left: '0px'
	})
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null

	const filteredSuggestions = computed(() => {
		if (triggerPosition.value === -1) return []

		const text = inputContainerRef.value?.textContent || ''
		const afterTrigger = text.slice(triggerPosition.value + 2) // After {{
		const endBrace = afterTrigger.indexOf('}}')
		const searchText = endBrace === -1 ? afterTrigger : afterTrigger.slice(0, endBrace)

		if (searchText.includes(' ')) return []

		const query = searchText.toLowerCase()
		return props.suggestions
			.filter(s => s.key.toLowerCase().includes(query))
			.slice(0, 10)
	})

	watch(
		() => props.modelValue,
		newValue => {
			const currentText = inputContainerRef.value?.textContent || ''
			if (newValue !== currentText) {
				updateContent(newValue)
			}
		}
	)

	onMounted(() => {
		if (props.modelValue) {
			updateContent(props.modelValue)
		}
		document.addEventListener('click', handleClickOutside)
	})

	onUnmounted(() => {
		document.removeEventListener('click', handleClickOutside)
		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
		}
	})

	function handleClickOutside(event: MouseEvent) {
		if (
			!inputContainerRef.value?.contains(event.target as Node) &&
			!autocompleteRef.value?.contains(event.target as Node)
		) {
			showAutocomplete.value = false
		}
	}

	function handleFocus() {
		isFocused.value = true
	}

	function handleBlur() {
		setTimeout(() => {
			isFocused.value = false
		}, 200)
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLDivElement
		const text = target.textContent || ''

		hasTextContent.value = text.length > 0

		// Save cursor position
		saveCursorPosition()

		// Apply highlighting
		highlightVariables(text)

		// Emit changes
		emit('update:modelValue', text)

		// Check for variable autocomplete trigger
		checkForAutocompleteTrigger(text)
	}

	function handleKeydown(event: KeyboardEvent) {
		// Handle autocomplete navigation
		if (showAutocomplete.value && filteredSuggestions.value.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault()
				selectedSuggestionIndex.value = Math.min(
					selectedSuggestionIndex.value + 1,
					filteredSuggestions.value.length - 1
				)
				return
			} else if (event.key === 'ArrowUp') {
				event.preventDefault()
				selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
				return
			} else if (event.key === 'Enter' || event.key === 'Tab') {
				event.preventDefault()
				selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
				return
			} else if (event.key === 'Escape') {
				showAutocomplete.value = false
				triggerPosition.value = -1
				return
			}
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault()
		const text = event.clipboardData?.getData('text/plain') || ''
		document.execCommand('insertText', false, text)
	}

	function handleMouseMove(event: MouseEvent) {
		// Clear any pending timeout
		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
			hoverTimeout = null
		}

		if (!event.target) {
			showTooltip.value = false
			return
		}

		const target = event.target as HTMLElement

		// Check if target has the closest method (is an Element)
		if (typeof target.closest !== 'function') {
			showTooltip.value = false
			return
		}

		// Find the closest variable pill element (could be hovering over text node inside)
		const pillElement = target.closest('.variable-pill') as HTMLElement | null

		if (pillElement && inputContainerRef.value) {
			const text = pillElement.textContent || ''
			const match = text.match(/\{\{([^}]+)\}\}/)

			if (match) {
				const variableName = match[1].trim()
				const suggestion = props.suggestions.find(s => s.key === variableName)

				// Use timeout to debounce and avoid rapid updates
				hoverTimeout = setTimeout(() => {
					try {
						// Update tooltip data
						tooltipData.value.name = variableName
						tooltipData.value.value = suggestion?.value || ''
						tooltipData.value.description = suggestion?.description || ''

						// Position tooltip
						const rect = pillElement.getBoundingClientRect()
						const containerRect = inputContainerRef.value?.getBoundingClientRect()

						if (containerRect) {
							tooltipPosition.value.top = `${rect.bottom - containerRect.top + 8}px`
							tooltipPosition.value.left = `${rect.left - containerRect.left}px`
						}

						// Show tooltip
						showTooltip.value = true
					} catch (error) {
						console.warn('Error showing tooltip:', error)
						showTooltip.value = false
					}
				}, 100)
			} else {
				showTooltip.value = false
			}
		} else {
			// Hide tooltip if not hovering over pill
			showTooltip.value = false
		}
	}

	function handleMouseLeave() {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
			hoverTimeout = null
		}
		showTooltip.value = false
	}

	function saveCursorPosition() {
		const selection = window.getSelection()
		if (!selection || !inputContainerRef.value) return

		try {
			const range = selection.getRangeAt(0)
			const preCaretRange = range.cloneRange()
			preCaretRange.selectNodeContents(inputContainerRef.value)
			preCaretRange.setEnd(range.endContainer, range.endOffset)
			currentCursorPosition.value = preCaretRange.toString().length
		} catch (e) {
			currentCursorPosition.value = 0
		}
	}

	function restoreCursorPosition(position: number) {
		if (!inputContainerRef.value) return

		const selection = window.getSelection()
		if (!selection) return

		let charCount = 0
		let nodeStack = [inputContainerRef.value]
		let node: Node | undefined
		let foundPosition = false

		while ((node = nodeStack.pop())) {
			if (node.nodeType === Node.TEXT_NODE) {
				const textNode = node as Text
				const nextCharCount = charCount + (textNode.length || 0)

				if (position >= charCount && position <= nextCharCount) {
					const range = document.createRange()
					range.setStart(textNode, Math.min(position - charCount, textNode.length || 0))
					range.collapse(true)
					selection.removeAllRanges()
					selection.addRange(range)
					foundPosition = true
					break
				}
				charCount = nextCharCount
			} else {
				const children = Array.from(node.childNodes).reverse()
				nodeStack.push(...children)
			}
		}

		if (!foundPosition && inputContainerRef.value.lastChild) {
			const range = document.createRange()
			range.selectNodeContents(inputContainerRef.value)
			range.collapse(false)
			selection.removeAllRanges()
			selection.addRange(range)
		}
	}

	function highlightVariables(text: string) {
		if (!inputContainerRef.value) return

		const cursorPos = currentCursorPosition.value

		// Build HTML with highlighted variables
		const html = text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
			return `<span class="variable-pill" contenteditable="true">${match}</span>`
		})

		// Get current HTML (normalized)
		const currentHTML = inputContainerRef.value.innerHTML

		// Only update if HTML actually changed (avoid unnecessary updates)
		if (currentHTML !== html && text !== '') {
			try {
				inputContainerRef.value.innerHTML = html

				// Restore cursor
				nextTick(() => {
					restoreCursorPosition(cursorPos)
				})
			} catch (error) {
				console.warn('Error updating innerHTML:', error)
			}
		}
	}

	function checkForAutocompleteTrigger(text: string) {
		const cursorPos = currentCursorPosition.value

		// Look backwards from cursor for {{
		let pos = cursorPos - 1
		let openBraceCount = 0

		while (pos >= 0) {
			if (text[pos] === '}' && text[pos + 1] === '}') {
				// Found closing braces before opening, stop
				triggerPosition.value = -1
				showAutocomplete.value = false
				return
			}
			if (text[pos] === '{' && text[pos + 1] === '{') {
				// Found opening {{
				triggerPosition.value = pos
				showAutocomplete.value = true
				selectedSuggestionIndex.value = 0
				return
			}
			pos--
		}

		// No trigger found
		triggerPosition.value = -1
		showAutocomplete.value = false
	}

	function selectSuggestion(suggestion: Suggestion) {
		if (!inputContainerRef.value) return

		const text = inputContainerRef.value.textContent || ''
		const beforeTrigger = text.slice(0, triggerPosition.value)
		const afterTrigger = text.slice(triggerPosition.value + 2)
		const endBrace = afterTrigger.indexOf('}}')
		const afterVariable = endBrace === -1 ? '' : afterTrigger.slice(endBrace + 2)

		const newText = `${beforeTrigger}{{${suggestion.key}}}${afterVariable}`
		const newCursorPos = beforeTrigger.length + suggestion.key.length + 4

		// Update content
		updateContent(newText)
		emit('update:modelValue', newText)

		// Hide autocomplete
		showAutocomplete.value = false
		triggerPosition.value = -1

		// Restore cursor after variable
		nextTick(() => {
			restoreCursorPosition(newCursorPos)
			inputContainerRef.value?.focus()
		})
	}

	function updateContent(text: string) {
		if (!inputContainerRef.value) return

		const cursorPos = currentCursorPosition.value
		hasTextContent.value = text.length > 0

		// Apply highlighting
		const html = text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
			return `<span class="variable-pill" contenteditable="true">${match}</span>`
		})

		try {
			inputContainerRef.value.innerHTML = html || ''

			nextTick(() => {
				if (cursorPos > 0) {
					restoreCursorPosition(cursorPos)
				}
			})
		} catch (error) {
			console.warn('Error updating content:', error)
		}
	}

	// Expose methods for parent components
	defineExpose({
		clear: () => {
			if (inputContainerRef.value) {
				inputContainerRef.value.textContent = ''
				hasTextContent.value = false
				emit('update:modelValue', '')
			}
		},
		getText: () => inputContainerRef.value?.textContent || '',
	})
</script>

<style scoped>
	.rich-pill-input-container {
		position: relative;
		width: 100%;
	}

	.rich-pill-input {
		min-height: 40px;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 14px;
		line-height: 24px;
		cursor: text;
		outline: none;
		transition: border-color 0.2s;
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	.rich-pill-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.rich-pill-input-container.is-focused .rich-pill-input {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.placeholder {
		color: #9ca3af;
		pointer-events: none;
		position: absolute;
		left: 12px;
		top: 10px;
	}

	/* Variable Pills */
	:deep(.variable-pill) {
		display: inline;
		padding: 2px 4px;
		margin: 0 1px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
		white-space: nowrap;
		cursor: help;
		transition: all 0.15s;
	}

	:deep(.variable-pill:hover) {
		background: #fde68a;
		border-color: #f59e0b;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Variable Tooltip */
	.variable-tooltip {
		position: absolute;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		padding: 12px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		z-index: 2000;
		min-width: 200px;
		max-width: 400px;
		pointer-events: none;
	}

	.tooltip-header {
		margin-bottom: 8px;
	}

	.tooltip-variable {
		font-family: monospace;
		font-weight: 600;
		font-size: 14px;
		color: #92400e;
		background: #fef3c7;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fcd34d;
	}

	.tooltip-value {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		margin-bottom: 6px;
	}

	.tooltip-label {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		white-space: nowrap;
	}

	.tooltip-value-text {
		font-size: 12px;
		color: #1f2937;
		word-break: break-all;
		font-family: monospace;
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 4px;
		flex: 1;
	}

	.tooltip-description {
		font-size: 11px;
		color: #9ca3af;
		margin-top: 6px;
		padding-top: 6px;
		border-top: 1px solid #e5e7eb;
	}

	/* Autocomplete */
	.autocomplete-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 300px;
		overflow-y: auto;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.autocomplete-item {
		padding: 8px 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		transition: background-color 0.15s;
	}

	.autocomplete-item:hover,
	.autocomplete-item.is-selected {
		background: #f3f4f6;
	}

	.suggestion-variable {
		font-weight: 600;
		font-family: monospace;
		color: #92400e;
		background: #fef3c7;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fcd34d;
	}

	.suggestion-description {
		margin-left: auto;
		font-size: 12px;
		color: #9ca3af;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.rich-pill-input {
			background: #1f2937;
			border-color: #374151;
			color: #f9fafb;
		}

		.rich-pill-input:focus,
		.rich-pill-input-container.is-focused .rich-pill-input {
			border-color: #3b82f6;
		}

		.autocomplete-dropdown {
			background: #1f2937;
			border-color: #374151;
		}

		.autocomplete-item:hover,
		.autocomplete-item.is-selected {
			background: #374151;
		}

		:deep(.variable-pill) {
			background: #78350f;
			color: #fef3c7;
			border-color: #92400e;
		}

		:deep(.variable-pill:hover) {
			background: #92400e;
			border-color: #b45309;
		}

		.variable-tooltip {
			background: #1f2937;
			border-color: #374151;
		}

		.tooltip-variable {
			background: #78350f;
			color: #fef3c7;
			border-color: #92400e;
		}

		.tooltip-value-text {
			background: #374151;
			color: #f9fafb;
		}

		.tooltip-label {
			color: #9ca3af;
		}

		.tooltip-description {
			border-top-color: #374151;
		}

		.suggestion-variable {
			background: #78350f;
			color: #fef3c7;
			border-color: #92400e;
		}
	}
</style>
