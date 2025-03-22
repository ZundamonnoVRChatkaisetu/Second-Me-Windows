import { AppProps } from 'next/app';
import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppProvider } from '@/lib/AppContext';
import { AnimatePresence } from 'framer-motion';

function MyApp({ Component, pageProps, router }: AppProps) {
  // アプリケーション全体のデフォルトスタイル適用
  useEffect(() => {
    // ドキュメントのベーススタイル設定
    document.documentElement.classList.add('scroll-smooth');
    
    // クリーンアップ関数
    return () => {
      document.documentElement.classList.remove('scroll-smooth');
    };
  }, []);

  return (
    <ThemeProvider>
      <AppProvider>
        <Head>
          <title>Second Me - Windows</title>
          <meta name="description" content="あなた自身のAI自己をWindowsで実現" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <AnimatePresence mode="wait">
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </AppProvider>
    </ThemeProvider>
  );
}

export default MyApp;
