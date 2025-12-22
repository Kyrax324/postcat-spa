export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'request' | 'response'

export interface ConsoleLog {
	id: string
	timestamp: number
	level: LogLevel
	message: string
	details?: unknown
	request?: {
		method: string
		url: string
		headers?: Record<string, string>
		body?: unknown
	}
	response?: {
		status: number
		statusText: string
		headers?: Record<string, string>
		body?: unknown
		time: number
		size: number
	}
}

export interface ConsoleFilters {
	levels: LogLevel[]
	search: string
}