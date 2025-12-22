export interface OpenAPISpec {
	openapi: string
	info: {
		title: string
		version: string
		description?: string
	}
	servers?: Array<{
		url: string
		description?: string
	}>
	paths: {
		[path: string]: PathItem
	}
	components?: {
		schemas?: Record<string, unknown>
		securitySchemes?: Record<string, unknown>
	}
}

export interface PathItem {
	get?: Operation
	post?: Operation
	put?: Operation
	patch?: Operation
	delete?: Operation
	options?: Operation
	head?: Operation
	trace?: Operation
}

export interface Operation {
	summary?: string
	description?: string
	operationId?: string
	tags?: string[]
	parameters?: Parameter[]
	requestBody?: RequestBody
	responses: {
		[statusCode: string]: Response
	}
	security?: Record<string, string[]>[]
}

export interface Parameter {
	name: string
	in: 'query' | 'header' | 'path' | 'cookie'
	description?: string
	required?: boolean
	schema?: {
		type: string
		default?: unknown
		enum?: unknown[]
	}
}

export interface RequestBody {
	description?: string
	required?: boolean
	content: {
		[mediaType: string]: {
			schema?: unknown
			example?: unknown
		}
	}
}

export interface Response {
	description: string
	content?: {
		[mediaType: string]: {
			schema?: unknown
		}
	}
}

export interface Endpoint {
	id: string
	path: string
	method: string
	summary: string
	description?: string
	tags: string[]
	parameters: Parameter[]
	requestBody?: RequestBody
	responses: Record<string, Response>
}