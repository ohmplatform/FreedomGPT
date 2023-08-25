import socket from "../socket/socket";
import DownloadProgressProvider from "@/context/DownloadContext";
import ModelProvider from "@/context/ModelSelection";
import "@/styles/globals.css";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";

const inter = Inter({ subsets: ["latin"] });

function App({
  Component,
  pageProps,
}: AppProps<{
  session: { user: { name: string; email: string; image: string } | null };
}>) {
  const queryClient = new QueryClient();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("connection", () => {
      console.log("connected");
    });
  }, []);

  return (
    <div className={inter.className}>
      <Toaster />

      <ModelProvider>
        <DownloadProgressProvider>
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
          </QueryClientProvider>
        </DownloadProgressProvider>
      </ModelProvider>
    </div>
  );
}

export default appWithTranslation(App);
