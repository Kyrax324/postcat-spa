import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConsoleLog, LogLevel, ConsoleFilters } from '@/types/console'

const MAX_LOGS = 1000

export const useConsoleStore = defineStore('console', () => {
	const logs = ref<ConsoleLog[]>([])
	const filters = ref<ConsoleFilters>({
		levels: ['info', 'success', 'warning', 'error', 'request', 'response'],
		search: '',
	})
	const isVisible = ref(false)

	// Filtered logs based on current filters
	const filteredLogs = computed(() => {
		let result = logs.value

		// Filter by level
		if (filters.value.levels.length > 0) {
			result = result.filter(log => filters.value.levels.includes(log.level))
		}

		// Filter by search query
		if (filters.value.search) {
			const query = filters.value.search.toLowerCase()
			result = result.filter(log => {
				return (
					log.message.toLowerCase().includes(query) ||
					log.request?.url.toLowerCase().includes(query) ||
					log.request?.method.toLowerCase().includes(query)
				)
			})
		}

		return result
	})

	// Count logs by level
	const logCounts = computed(() => {
		const counts: Record<LogLevel, number> = {
			info: 0,
			success: 0,
			warning: 0,
			error: 0,
			request: 0,
			response: 0,
		}

		logs.value.forEach(log => {
			counts[log.level]++
		})

		return counts
	})

	// Add a log entry
	function addLog(
		level: LogLevel,
		message: string,
		details?: unknown,
		request?: ConsoleLog['request'],
		response?: ConsoleLog['response']
	) {
		const log: ConsoleLog = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			level,
			message,
			details,
			request,
			response,
		}

		logs.value.unshift(log) // Add to beginning

		// Keep only last MAX_LOGS entries
		if (logs.value.length > MAX_LOGS) {
			logs.value = logs.value.slice(0, MAX_LOGS)
		}
	}

	// Convenience methods for different log levels
	function info(message: string, details?: unknown) {
		addLog('info', message, details)
	}

	function success(message: string, details?: unknown) {
		addLog('success', message, details)
	}

	function warning(message: string, details?: unknown) {
		addLog('warning', message, details)
	}

	function error(message: string, details?: unknown) {
		addLog('error', message, details)
	}

	function logRequest(
		method: string,
		url: string,
		headers?: Record<string, string>,
		body?: unknown
	) {
		addLog(
			'request',
			`${method} ${url}`,
			undefined,
			{
				method,
				url,
				headers,
				body,
			},
			undefined
		)
	}

	function logResponse(
		request: ConsoleLog['request'],
		status: number,
		statusText: string,
		headers?: Record<string, string>,
		body?: unknown,
		time?: number,
		size?: number
	) {
		addLog(
			'response',
			`${status} ${statusText} - ${time}ms`,
			undefined,
			request,
			{
				status,
				statusText,
				headers,
				body,
				time: time || 0,
				size: size || 0,
			}
		)
	}

	// Clear all logs
	function clear() {
		logs.value = []
	}

	// Toggle filter level
	function toggleLevel(level: LogLevel) {
		const index = filters.value.levels.indexOf(level)
		if (index > -1) {
			filters.value.levels.splice(index, 1)
		} else {
			filters.value.levels.push(level)
		}
	}

	// Set search query
	function setSearch(query: string) {
		filters.value.search = query
	}

	// Toggle visibility
	function toggleVisibility() {
		isVisible.value = !isVisible.value
	}

	function show() {
		isVisible.value = true
	}

	function hide() {
		isVisible.value = false
	}

	return {
		logs,
		filteredLogs,
		filters,
		logCounts,
		isVisible,
		addLog,
		info,
		success,
		warning,
		error,
		logRequest,
		logResponse,
		clear,
		toggleLevel,
		setSearch,
		toggleVisibility,
		show,
		hide,
	}
})