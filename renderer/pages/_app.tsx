import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import ModelProvider from '@/context/ModelSelection';
import socket from '@/socket/socket';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('connected (connect)');
      });
      socket.on('connection', () => {
        console.log('connected (connection)');
      });
    }
  }, []);

  return (
    <div className={inter.className}>
      <Toaster />
      <ModelProvider>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </ModelProvider>
    </div>
  );
}

export default appWithTranslation(App);
