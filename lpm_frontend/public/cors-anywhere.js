const express = require('express');
const httpProxy = require('http-proxy-middleware');
const createProxyMiddleware = httpProxy.createProxyMiddleware;

// 環境変数を読み込む
const BACKEND_PORT = process.env.BACKEND_PORT || 8002;
const CORS_PORT = process.env.CORS_PORT || 8003;

const app = express();

// リクエスト情報をロギング
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// CORSヘッダーを追加する関数
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '3600');
  
  // preflightリクエストを処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// APIリクエストをバックエンドにプロキシする
const apiProxy = createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api',  // パスの書き換えなし
  },
  onProxyReq: (proxyReq, req, res) => {
    // リクエストヘッダーを追加する必要がある場合
    proxyReq.setHeader('X-Forwarded-By', 'CORS-Proxy');
    
    // デバッグのためリクエスト情報をコンソールに出力
    console.log(`プロキシリクエスト: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // CORS関連のヘッダーを追加
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
    
    // レスポンスステータスコードをログに出力
    console.log(`バックエンドからのレスポンス: ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('プロキシエラー:', err);
    res.status(500).json({
      error: 'バックエンドサービスに接続できませんでした。サービスが実行中か確認してください。',
      code: 'ECONNREFUSED'
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cors-proxy',
    timestamp: new Date().toISOString()
  });
});

// プロキシミドルウェアを設定
app.use('/api', apiProxy);
app.use('/', apiProxy);  // ルートパスへのリクエストもプロキシ

// サーバー起動
app.listen(CORS_PORT, () => {
  console.log(`CORS Proxyがポート${CORS_PORT}で実行中...`);
  console.log(`バックエンドの接続先: http://localhost:${BACKEND_PORT}`);
  console.log('すべてのオリジンからのCORSリクエストを許可します');
});

// 正常終了時の処理
process.on('SIGINT', () => {
  console.log('CORSプロキシを終了しています...');
  process.exit(0);
});
