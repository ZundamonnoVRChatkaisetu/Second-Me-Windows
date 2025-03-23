import axios from 'axios';

// 環境変数からバックエンドのURLを取得、デフォルト値も設定
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

console.log('Using backend URL:', BACKEND_URL);

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // タイムアウトを30秒に延長（ファイルアップロード対応）
  withCredentials: false // CORSの際にクレデンシャルを送信しない
});

// リクエスト時のインターセプター（デバッグ用）
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request to ${config.url}, Method: ${config.method?.toUpperCase()}`);
    console.log('Request Headers:', config.headers);
    if (config.data) {
      console.log('Request Data:', config.data);
    }
    // CORSヘッダーを追加
    config.headers['Access-Control-Allow-Origin'] = '*';
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
    console.log('Response Headers:', response.headers);
    console.log('Response Data:', response.data);
    return response;
  },
  (error) => {
    // ネットワークエラーの場合
    if (!error.response) {
      console.error('API Network Error - No response received');
      console.error('Error Details:', error);
      return Promise.reject({
        ...error,
        message: 'バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。',
        isNetworkError: true
      });
    }
    
    // CORS関連のエラーを検出
    if (error.response.status === 0) {
      console.error('API CORS Error - Blocked by browser security policy');
      return Promise.reject({
        ...error,
        message: 'CORSエラーが発生しました。サーバーを再起動してください。',
        isCorsError: true
      });
    }
    
    // その他のエラー
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Headers:', error.response.headers);
      
      // エラーに詳細情報を追加
      return Promise.reject({
        ...error,
        details: {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.error || error.message
        }
      });
    } else {
      console.error('API Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// ヘルスチェック用の関数（バックエンド接続確認）
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    console.log(`Checking backend health at: ${BACKEND_URL}/api/health`);
    const response = await apiClient.get('/api/health', {
      timeout: 5000 // ヘルスチェックは短いタイムアウトで
    });
    console.log('Health check response:', response.data);
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    // 代替パスでも試行
    try {
      console.log(`Retrying with alternative endpoint: ${BACKEND_URL}/health`);
      const altResponse = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 5000
      });
      console.log('Alternative health check response:', altResponse.data);
      return altResponse.status === 200;
    } catch (altError) {
      console.error('Alternative health check also failed:', altError);
      return false;
    }
  }
};

// リトライ機能付きの汎用関数
const withRetry = async <T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.isNetworkError || error.isCorsError)) {
      console.log(`Retrying operation, ${retries} attempts left. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

// ファイルアップロード用の関数
export const uploadFile = async (
  file: File, 
  category: string,
  onProgress?: (progressEvent: any) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  return withRetry(async () => {
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
  });
};

// ファイル一覧を取得する関数
export const getUploadedFiles = async (category?: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/files', {
        params: category ? { category } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  });
};

// トレーニングデータ関連API

// トレーニングデータ一覧を取得
export const getTrainingData = async (category?: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/training/data', {
        params: category ? { category } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching training data:', error);
      throw error;
    }
  });
};

// 特定のトレーニングデータを取得
export const getTrainingDataById = async (dataId: string, path: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get(`/api/training/data/${dataId}`, {
        params: { path },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching training data ${dataId}:`, error);
      throw error;
    }
  });
};

// トレーニングデータをアップロード
export const uploadTrainingData = async (
  files: File[],
  category: string,
  onProgress?: (progressEvent: any) => void
): Promise<any> => {
  const formData = new FormData();
  
  // 複数ファイルを対応
  for (const file of files) {
    formData.append('file', file);
  }
  
  formData.append('category', category);

  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/training/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
      });
      return response.data;
    } catch (error) {
      console.error('Training data upload error:', error);
      throw error;
    }
  });
};

// トレーニングデータを削除
export const deleteTrainingData = async (dataId: string, path: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.delete(`/api/training/data/${dataId}`, {
        params: { path },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting training data ${dataId}:`, error);
      throw error;
    }
  });
};

// トレーニングプロセスを開始
export const startTrainingProcess = async (params: {
  model_path?: string;
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  categories?: string[];
}): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/training/process', params);
      return response.data;
    } catch (error) {
      console.error('Error starting training process:', error);
      throw error;
    }
  });
};

// トレーニングプロセスの状態を取得
export const getTrainingProcessStatus = async (trainingId: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get(`/api/training/status/${trainingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching training process status ${trainingId}:`, error);
      throw error;
    }
  });
};

// トレーニングログを取得
export const getTrainingLog = async (trainingId: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get(`/api/training/log/${trainingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching training log ${trainingId}:`, error);
      throw error;
    }
  });
};

// トレーニング履歴を取得
export const getTrainingHistory = async (): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/training/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching training history:', error);
      throw error;
    }
  });
};

// トレーニングプロセスをキャンセル
export const cancelTrainingProcess = async (trainingId: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post(`/api/training/cancel/${trainingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelling training process ${trainingId}:`, error);
      throw error;
    }
  });
};

// チャットメッセージを送信する関数
export const sendChatMessage = async (message: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/chat', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  });
};

// チャット履歴を取得する関数
export const getChatHistory = async (): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/chat/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  });
};

// メモリー関連API
export const getMemories = async (): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/memory');
      return response.data;
    } catch (error) {
      console.error('Error fetching memories:', error);
      throw error;
    }
  });
};

export const getMemory = async (memoryId: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get(`/api/memory/${memoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching memory ${memoryId}:`, error);
      throw error;
    }
  });
};

export const createMemory = async (memory: {
  content: string;
  category?: string;
  importance?: number;
}): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/memory', memory);
      return response.data;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  });
};

export const updateMemory = async (
  memoryId: string,
  memory: {
    content?: string;
    category?: string;
    importance?: number;
  }
): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.put(`/api/memory/${memoryId}`, memory);
      return response.data;
    } catch (error) {
      console.error(`Error updating memory ${memoryId}:`, error);
      throw error;
    }
  });
};

export const deleteMemory = async (memoryId: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.delete(`/api/memory/${memoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting memory ${memoryId}:`, error);
      throw error;
    }
  });
};

export const importMemories = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/memory/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error importing memories:', error);
      throw error;
    }
  });
};

// WorkSpace関連API
export const listWorkSpaceFiles = async (directory?: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/workspace/list', {
        params: directory ? { dir: directory } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error listing workspace files:', error);
      throw error;
    }
  });
};

export const getWorkSpaceFile = async (filePath: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.get('/api/workspace/file', {
        params: { path: filePath },
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting workspace file ${filePath}:`, error);
      throw error;
    }
  });
};

export const createWorkSpaceFile = async (filePath: string, content: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/workspace/file', {
        path: filePath,
        content,
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating workspace file ${filePath}:`, error);
      throw error;
    }
  });
};

export const updateWorkSpaceFile = async (filePath: string, content: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.put('/api/workspace/file', {
        path: filePath,
        content,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating workspace file ${filePath}:`, error);
      throw error;
    }
  });
};

export const deleteWorkSpaceFile = async (filePath: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.delete('/api/workspace/file', {
        params: { path: filePath },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting workspace file ${filePath}:`, error);
      throw error;
    }
  });
};

export const createWorkSpaceDirectory = async (dirPath: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/workspace/directory', {
        path: dirPath,
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating workspace directory ${dirPath}:`, error);
      throw error;
    }
  });
};

export const deleteWorkSpaceDirectory = async (dirPath: string): Promise<any> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.delete('/api/workspace/directory', {
        params: { path: dirPath },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting workspace directory ${dirPath}:`, error);
      throw error;
    }
  });
};

export default apiClient;
