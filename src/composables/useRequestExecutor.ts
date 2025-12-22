import axios, { type AxiosRequestConfig } from 'axios'
import { useRequestStore } from '@/stores/request'
import { useSettingsStore } from '@/stores/settings'
import { useConsoleStore } from '@/stores/console'
import { useVariablesStore } from '@/stores/variables'
import type { ApiRequest, ApiResponse } from '@/types/request'

export function useRequestExecutor() {
	const requestStore = useRequestStore()
	const settingsStore = useSettingsStore()
	const consoleStore = useConsoleStore()
	const variablesStore = useVariablesStore()

	async function executeRequest(request?: ApiRequest): Promise<ApiResponse> {
		const req = request || requestStore.currentRequest

		// Interpolate all variables in URL (including {{serverPath}})
		let url = variablesStore.interpolate(req.url)

		// Build headers with variable interpolation
		const headers: Record<string, string> = {}
		req.headers.forEach(header => {
			if (header.enabled && header.key) {
				headers[header.key] = variablesStore.interpolate(header.value)
			}
		})

		// Build query params with variable interpolation
		const params: Record<string, string> = {}
		req.queryParams.forEach(param => {
			if (param.enabled && param.key) {
				params[param.key] = variablesStore.interpolate(param.value)
			}
		})

		// Prepare request body with variable interpolation
		let data: unknown = undefined
		if (req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none') {
			if (req.bodyType === 'json') {
				try {
					const interpolatedBody = variablesStore.interpolate(req.body)
					data = interpolatedBody ? JSON.parse(interpolatedBody) : undefined
				} catch (error) {
					throw new Error('Invalid JSON in request body')
				}
			} else {
				data = variablesStore.interpolate(req.body)
			}
		}

		// Prepare axios config
		const config: AxiosRequestConfig = {
			method: req.method,
			url,
			headers,
			params,
			data,
			timeout: settingsStore.settings.timeout,
			validateStatus: () => true, // Don't throw on any status code
		}

		requestStore.setLoading(true)
		const startTime = performance.now()

		// Log request to console
		consoleStore.logRequest(config.method!.toUpperCase(), url, headers, data)

		try {
			const response = await axios(config)
			const endTime = performance.now()

			// Calculate response size (approximate)
			const size = new Blob([JSON.stringify(response.data)]).size

			const apiResponse: ApiResponse = {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers as Record<string, string>,
				data: response.data,
				time: Math.round(endTime - startTime),
				size,
				timestamp: Date.now(),
			}

			requestStore.setResponse(apiResponse)
			requestStore.addToHistory(req, apiResponse)

			// Log response to console
			consoleStore.logResponse(
				{
					method: config.method!.toUpperCase(),
					url,
					headers,
					body: data,
				},
				apiResponse.status,
				apiResponse.statusText,
				apiResponse.headers,
				apiResponse.data,
				apiResponse.time,
				apiResponse.size
			)

			// Log success or error based on status
			if (apiResponse.status >= 200 && apiResponse.status < 300) {
				consoleStore.success(
					`Request completed successfully - ${apiResponse.status} ${apiResponse.statusText}`
				)
			} else if (apiResponse.status >= 400) {
				consoleStore.warning(`Request failed - ${apiResponse.status} ${apiResponse.statusText}`)
			}

			return apiResponse
		} catch (error: unknown) {
			const endTime = performance.now()

			const errorResponse: ApiResponse = {
				status: 0,
				statusText: error instanceof Error ? error.message : 'Request failed',
				headers: {},
				data: { error: error instanceof Error ? error.message : 'Unknown error' },
				time: Math.round(endTime - startTime),
				size: 0,
				timestamp: Date.now(),
			}

			requestStore.setResponse(errorResponse)
			requestStore.addToHistory(req, errorResponse)

			// Log error to console
			consoleStore.error(
				`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				error
			)

			throw error
		} finally {
			requestStore.setLoading(false)
		}
	}

	return {
		executeRequest,
	}
}