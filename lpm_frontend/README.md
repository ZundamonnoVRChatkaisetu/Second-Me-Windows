# Second Me Windows - フロントエンド

このディレクトリには、Second Me Windowsのフロントエンドアプリケーションが含まれています。Next.jsをベースにしたReactアプリケーションです。

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [React](https://reactjs.org/) - UIライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Axios](https://axios-http.com/) - HTTPクライアント

## 開発の開始方法

1. 依存関係のインストール:

```bash
npm install
```

2. 開発サーバーの起動:

```bash
npm run dev
```

3. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 環境変数

フロントエンドアプリケーションは以下の環境変数を使用します:

- `NEXT_PUBLIC_BACKEND_URL` - バックエンドAPIのURL (デフォルト: `http://localhost:8002`)

`.env.local`ファイルを作成してこれらの設定を上書きできます。

## フォルダ構造

- `src/components/` - 再利用可能なReactコンポーネント
- `src/lib/` - ユーティリティ関数とヘルパー
- `src/pages/` - アプリケーションのページ
- `src/styles/` - グローバルスタイル設定
- `public/` - 静的アセット

## 主要機能

- ホームページ - Second Meの概要と機能説明
- AIセルフ作成プロセス - ステップバイステップのガイド付き作成フロー
- チャットインターフェース - Second Meとの対話機能

## バックエンド接続

フロントエンドはデフォルトで`http://localhost:8002`にあるバックエンドサービスへ接続します。
この設定は`.env.local`ファイルや起動スクリプトで変更できます。

## ビルドと本番デプロイ

1. アプリケーションをビルド:

```bash
npm run build
```

2. 本番用サーバーを起動:

```bash
npm run start
```

## レスポンシブデザイン

アプリケーションはモバイル、タブレット、デスクトップなど様々な画面サイズに対応しています。

## アクセシビリティ

このプロジェクトではWCAGガイドラインに従ってアクセシビリティを確保するよう努めています。

## ライセンス

このプロジェクトはApache License 2.0の下でライセンスされています。詳細については、ルートディレクトリのLICENSEファイルを参照してください。
