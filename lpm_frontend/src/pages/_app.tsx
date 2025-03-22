import { AppProps } from 'next/app';
import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  // アプリケーション全体のデフォルトスタイル適用
  useEffect(() => {
    // ドキュメントのベーススタイル設定
    document.documentElement.classList.add('scroll-smooth');
    document.body.classList.add('bg-gray-50', 'text-gray-900', 'antialiased');
    
    // クリーンアップ関数
    return () => {
      document.documentElement.classList.remove('scroll-smooth');
      document.body.classList.remove('bg-gray-50', 'text-gray-900', 'antialiased');
    };
  }, []);

  return (
    <>
      <Head>
        <title>Second Me - Windows</title>
        <meta name="description" content="あなた自身のAI自己をWindowsで実現" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
