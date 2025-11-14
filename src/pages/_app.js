import React from 'react';
import Layout from "../components/Layout";
import "../global.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorProvider } from '../components/ErrorNotification';
import { ConfirmProvider } from '../components/ConfirmDialog';

// Create a client for react-query (will be created per instance on the server, per session on client)
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });
};

let clientQueryClient;

// Get or create query client
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }

  // Browser: reuse client on the client-side
  if (!clientQueryClient) {
    clientQueryClient = createQueryClient();
  }

  return clientQueryClient;
}

export default function MyApp({ Component, pageProps }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <ConfirmProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ConfirmProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
}
