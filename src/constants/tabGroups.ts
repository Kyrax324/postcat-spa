import type { TabGroupColor, TabGroupColorConfig } from '@/types/request'

export const TAB_GROUP_COLORS: TabGroupColorConfig[] = [
	{
		name: 'gray',
		light: '#9CA3AF',
		dark: '#6B7280',
	},
	{
		name: 'red',
		light: '#EF4444',
		dark: '#DC2626',
	},
	{
		name: 'orange',
		light: '#F97316',
		dark: '#EA580C',
	},
	{
		name: 'yellow',
		light: '#EAB308',
		dark: '#CA8A04',
	},
	{
		name: 'green',
		light: '#10B981',
		dark: '#059669',
	},
	{
		name: 'blue',
		light: '#3B82F6',
		dark: '#2563EB',
	},
	{
		name: 'purple',
		light: '#A855F7',
		dark: '#9333EA',
	},
	{
		name: 'pink',
		light: '#EC4899',
		dark: '#DB2777',
	},
]

export function getGroupColor(
	colorName: TabGroupColor,
	isDark: boolean = false
): string {
	const config = TAB_GROUP_COLORS.find((c) => c.name === colorName)
	return config ? (isDark ? config.dark : config.light) : TAB_GROUP_COLORS[0].light
}
