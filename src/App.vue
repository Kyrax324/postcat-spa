<template>
	<n-config-provider
		:theme="theme"
		:theme-overrides="themeOverrides"
		class="h-full"
	>
		<n-notification-provider>
			<n-message-provider>
				<n-dialog-provider>
					<router-view />
				</n-dialog-provider>
			</n-message-provider>
		</n-notification-provider>
	</n-config-provider>
</template>

<script setup lang="ts">
	import { computed, watch, onMounted } from 'vue'
	import { darkTheme } from 'naive-ui'
	import type { GlobalThemeOverrides } from 'naive-ui'
	import { useSettingsStore } from '@/stores/settings'

	const settingsStore = useSettingsStore()

	// Determine if system prefers dark mode
	const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

	// Color map for accent colors
	const colorMap: Record<string, { base: string; hover: string; pressed: string; suppl: string }> = {
		green: { base: '#10b981', hover: '#059669', pressed: '#047857', suppl: '#34d399' },
		teal: { base: '#14b8a6', hover: '#0d9488', pressed: '#0f766e', suppl: '#2dd4bf' },
		blue: { base: '#3b82f6', hover: '#2563eb', pressed: '#1d4ed8', suppl: '#60a5fa' },
		indigo: { base: '#6366f1', hover: '#4f46e5', pressed: '#4338ca', suppl: '#818cf8' },
		purple: { base: '#a855f7', hover: '#9333ea', pressed: '#7e22ce', suppl: '#c084fc' },
		yellow: { base: '#eab308', hover: '#ca8a04', pressed: '#a16207', suppl: '#fde047' },
		orange: { base: '#f97316', hover: '#ea580c', pressed: '#c2410c', suppl: '#fb923c' },
		red: { base: '#ef4444', hover: '#dc2626', pressed: '#b91c1c', suppl: '#f87171' },
		pink: { base: '#ec4899', hover: '#db2777', pressed: '#be185d', suppl: '#f472b6' },
	}

	const theme = computed(() => {
		const themeSetting = settingsStore.settings.theme
		if (themeSetting === 'system') {
			return systemPrefersDark ? darkTheme : null
		}
		return themeSetting === 'dark' ? darkTheme : null
	})

	const themeOverrides = computed<GlobalThemeOverrides>(() => {
		const accentColor = settingsStore.settings.accentColor
		const colors = colorMap[accentColor]

		return {
			common: {
				primaryColor: colors.base,
				primaryColorHover: colors.hover,
				primaryColorPressed: colors.pressed,
				primaryColorSuppl: colors.suppl,
			},
			Button: {
				textColorPrimary: '#fff',
				textColorHoverPrimary: '#fff',
				textColorPressedPrimary: '#fff',
				textColorFocusPrimary: '#fff',
				textColorDisabledPrimary: '#fff',
			},
		}
	})

	const isDark = computed(() => {
		const themeSetting = settingsStore.settings.theme
		if (themeSetting === 'system') {
			return systemPrefersDark
		}
		return themeSetting === 'dark'
	})

	// Apply dark class to html element for Tailwind dark mode
	watch(
		isDark,
		dark => {
			if (dark) {
				document.documentElement.classList.add('dark')
			} else {
				document.documentElement.classList.remove('dark')
			}
		},
		{ immediate: true }
	)

	// Apply accent color as CSS variable
	watch(
		() => settingsStore.settings.accentColor,
		(accentColor) => {
			document.documentElement.style.setProperty('--accent-color', colorMap[accentColor].base)
		},
		{ immediate: true }
	)

	// Listen for system theme changes
	onMounted(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		mediaQuery.addEventListener('change', (e) => {
			if (settingsStore.settings.theme === 'system') {
				if (e.matches) {
					document.documentElement.classList.add('dark')
				} else {
					document.documentElement.classList.remove('dark')
				}
			}
		})
	})
</script>

<style scoped></style>
