import React from 'react';
import Link from 'next/link';

/**
 * アプリケーションのフッターコンポーネント
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ブランドセクション */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <div className="w-6 h-6 rounded-full bg-blue-400"></div>
              </div>
              <span className="text-gray-800 font-medium text-lg">Second Me</span>
            </div>
            <p className="text-gray-600 text-sm">
              あなた自身のAI自己をWindowsで実現。
              プライバシーとコントロールを保ちながら、
              あなたのデジタルアイデンティティを拡張します。
            </p>
          </div>

          {/* 製品セクション */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">製品</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-gray-600 hover:text-gray-900 text-sm">
                  機能
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">
                  料金プラン
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-gray-600 hover:text-gray-900 text-sm">
                  ロードマップ
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-gray-600 hover:text-gray-900 text-sm">
                  変更履歴
                </Link>
              </li>
            </ul>
          </div>

          {/* リソースセクション */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">リソース</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-gray-600 hover:text-gray-900 text-sm">
                  ドキュメント
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-gray-600 hover:text-gray-900 text-sm">
                  チュートリアル
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900 text-sm">
                  よくある質問
                </Link>
              </li>
              <li>
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" 
                      target="_blank" 
                      className="text-gray-600 hover:text-gray-900 text-sm">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* 会社セクション */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">会社</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm">
                  私たちについて
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライトセクション */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Second Me Windows. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
