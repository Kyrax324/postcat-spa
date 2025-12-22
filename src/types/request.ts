export interface HttpHeader {
	key: string
	value: string
	enabled: boolean
}

export interface QueryParam {
	key: string
	value: string
	enabled: boolean
}

export interface ApiRequest {
	method: string
	url: string
	headers: HttpHeader[]
	queryParams: QueryParam[]
	body: string
	bodyType: 'json' | 'form' | 'raw' | 'none'
}

export interface ApiResponse {
	status: number
	statusText: string
	headers: Record<string, string>
	data: unknown
	time: number
	size: number
	timestamp: number
}

export interface RequestHistory {
	id: string
	request: ApiRequest
	response: ApiResponse | null
	timestamp: number
}

export interface RequestTab {
	id: string
	name: string
	request: ApiRequest
	response: ApiResponse | null
	isLoading: boolean
}