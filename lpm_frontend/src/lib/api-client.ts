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
  timeout: 30000, // タイムアウトを30秒に延長（ファイルアップロード対応）
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

// ファイルアップロード用の関数
export const uploadFile = async (
  file: File, 
  category: string,
  onProgress?: (progressEvent: any) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  try {
    const response = await apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// ファイル一覧を取得する関数
export const getUploadedFiles = async (category?: string): Promise<any> => {
  try {
    const response = await apiClient.get('/api/files', {
      params: category ? { category } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

// トレーニングプロセスを開始する関数
export const startTraining = async (options?: any): Promise<any> => {
  try {
    const response = await apiClient.post('/api/training/start', options || {});
    return response.data;
  } catch (error) {
    console.error('Error starting training:', error);
    throw error;
  }
};

// トレーニングの状態を取得する関数
export const getTrainingStatus = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/training/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching training status:', error);
    throw error;
  }
};

// チャットメッセージを送信する関数
export const sendChatMessage = async (message: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/chat', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// チャット履歴を取得する関数
export const getChatHistory = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/chat/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// ヘルスチェック用の関数
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/health');
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default apiClient;
