import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import './styles/theme.css'

const queryClient = new QueryClient()

// E2E i zrzuty: front w przeglądarce bez Rusta, wywołania IPC podmienione na odpowiedzi testowe.
const ipc = import.meta.env.VITE_MOCK_IPC
  ? import('./mocks/ipc').then(({ installIpcMock }) => installIpcMock())
  : Promise.resolve()

void ipc.then(() => {
  const root = document.getElementById('root')
  if (!root) throw new Error('Brak elementu #root w index.html')
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
