import type { RouteObject } from 'react-router'
import { createBrowserRouter } from 'react-router'

const screens: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('@/features/projects/ProjectsPage')).ProjectsPage }) },
]

// Strona wzorców wspólnych elementów tylko w buildzie deweloperskim (e2e i zrzuty działają na serwerze Vite).
if (import.meta.env.DEV) {
  screens.push({
    path: 'patterns',
    lazy: async () => ({ Component: (await import('@/features/patterns/PatternsPage')).PatternsPage }),
  })
}

// Ekrany ładują się leniwie; do czasu załadowania pierwszego nic nie rysujemy.
export const router = createBrowserRouter([{ path: '/', HydrateFallback: () => null, children: screens }])
