export interface ApiDocPath {
	name: string
	path: string
}

export interface Variable {
	key: string
	value: string
	description?: string
	enabled: boolean
}

export interface Settings {
	apiDocsPath: string // Legacy - kept for backward compatibility
	apiDocsPaths: ApiDocPath[] // New - support multiple paths
	currentApiDocsPath: string // Currently selected path
	defaultApiDocsPath: string // Default path to load on startup
	profilePath: string // Path to profile JSON file
	encoding: 'utf-8' | 'base64'
	theme: 'light' | 'dark' | 'system'
	accentColor: 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'yellow' | 'orange' | 'red' | 'pink'
	layoutMode: 'horizontal' | 'vertical' // Request/Response panel layout
	timeout: number
	selectedServerUrl: string // Currently selected server URL from OpenAPI spec
}

export interface Profile {
	name: string
	version: string
	description?: string
	apiDocsPaths: ApiDocPath[]
	settings?: Partial<Settings>
}