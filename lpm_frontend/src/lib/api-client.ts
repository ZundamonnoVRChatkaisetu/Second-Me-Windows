import axios from 'axios';

// 環境変数からバックエンドのURLを取得、デフォルト値も設定
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

console.log('Using backend URL:', BACKEND_URL);

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
});

// リクエスト時のインターセプター（デバッグ用）
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンス時のインターセプター（デバッグ用）
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('API Error: No response received');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
