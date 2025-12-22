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
	groupId?: string
}

export interface TabGroup {
	id: string
	name: string
	color: TabGroupColor
	isCollapsed: boolean
	createdAt: number
}

export type TabGroupColor =
	| 'gray'
	| 'red'
	| 'orange'
	| 'yellow'
	| 'green'
	| 'blue'
	| 'purple'
	| 'pink'

export interface TabGroupColorConfig {
	name: TabGroupColor
	light: string
	dark: string
}