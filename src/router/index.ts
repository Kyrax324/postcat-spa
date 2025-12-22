import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/:pathMatch(.*)*',
			name: 'home',
			component: () => import('@/views/ApiTester.vue'),
		},
	],
})

export default router
