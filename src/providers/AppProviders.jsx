import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppContextProvider } from '../context/AppContextProvider.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function AppProviders({ children }) {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#2563eb',
              borderRadius: 8,
              fontFamily:
                "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            },
          }}
        >
          <AntApp>
            <AppContextProvider>
              <BrowserRouter>{children}</BrowserRouter>
            </AppContextProvider>
          </AntApp>
        </ConfigProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
