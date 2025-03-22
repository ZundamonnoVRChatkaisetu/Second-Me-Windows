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

// トレーニングデータ関連API

// トレーニングデータ一覧を取得
export const getTrainingData = async (category?: string): Promise<any> => {
  try {
    const response = await apiClient.get('/api/training/data', {
      params: category ? { category } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching training data:', error);
    throw error;
  }
};

// 特定のトレーニングデータを取得
export const getTrainingDataById = async (dataId: string, path: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/training/data/${dataId}`, {
      params: { path },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching training data ${dataId}:`, error);
    throw error;
  }
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
};

// トレーニングデータを削除
export const deleteTrainingData = async (dataId: string, path: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/training/data/${dataId}`, {
      params: { path },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting training data ${dataId}:`, error);
    throw error;
  }
};

// トレーニングプロセスを開始
export const startTrainingProcess = async (params: {
  model_path?: string;
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  categories?: string[];
}): Promise<any> => {
  try {
    const response = await apiClient.post('/api/training/process', params);
    return response.data;
  } catch (error) {
    console.error('Error starting training process:', error);
    throw error;
  }
};

// トレーニングプロセスの状態を取得
export const getTrainingProcessStatus = async (trainingId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/training/status/${trainingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching training process status ${trainingId}:`, error);
    throw error;
  }
};

// トレーニングログを取得
export const getTrainingLog = async (trainingId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/training/log/${trainingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching training log ${trainingId}:`, error);
    throw error;
  }
};

// トレーニング履歴を取得
export const getTrainingHistory = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/training/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching training history:', error);
    throw error;
  }
};

// トレーニングプロセスをキャンセル
export const cancelTrainingProcess = async (trainingId: string): Promise<any> => {
  try {
    const response = await apiClient.post(`/api/training/cancel/${trainingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling training process ${trainingId}:`, error);
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

// メモリー関連API
export const getMemories = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/memory');
    return response.data;
  } catch (error) {
    console.error('Error fetching memories:', error);
    throw error;
  }
};

export const getMemory = async (memoryId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/memory/${memoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching memory ${memoryId}:`, error);
    throw error;
  }
};

export const createMemory = async (memory: {
  content: string;
  category?: string;
  importance?: number;
}): Promise<any> => {
  try {
    const response = await apiClient.post('/api/memory', memory);
    return response.data;
  } catch (error) {
    console.error('Error creating memory:', error);
    throw error;
  }
};

export const updateMemory = async (
  memoryId: string,
  memory: {
    content?: string;
    category?: string;
    importance?: number;
  }
): Promise<any> => {
  try {
    const response = await apiClient.put(`/api/memory/${memoryId}`, memory);
    return response.data;
  } catch (error) {
    console.error(`Error updating memory ${memoryId}:`, error);
    throw error;
  }
};

export const deleteMemory = async (memoryId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/memory/${memoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting memory ${memoryId}:`, error);
    throw error;
  }
};

export const importMemories = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

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
};

// WorkSpace関連API
export const listWorkSpaceFiles = async (directory?: string): Promise<any> => {
  try {
    const response = await apiClient.get('/api/workspace/list', {
      params: directory ? { dir: directory } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error listing workspace files:', error);
    throw error;
  }
};

export const getWorkSpaceFile = async (filePath: string): Promise<any> => {
  try {
    const response = await apiClient.get('/api/workspace/file', {
      params: { path: filePath },
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting workspace file ${filePath}:`, error);
    throw error;
  }
};

export const createWorkSpaceFile = async (filePath: string, content: string): Promise<any> => {
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
};

export const updateWorkSpaceFile = async (filePath: string, content: string): Promise<any> => {
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
};

export const deleteWorkSpaceFile = async (filePath: string): Promise<any> => {
  try {
    const response = await apiClient.delete('/api/workspace/file', {
      params: { path: filePath },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting workspace file ${filePath}:`, error);
    throw error;
  }
};

export const createWorkSpaceDirectory = async (dirPath: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/workspace/directory', {
      path: dirPath,
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating workspace directory ${dirPath}:`, error);
    throw error;
  }
};

export const deleteWorkSpaceDirectory = async (dirPath: string): Promise<any> => {
  try {
    const response = await apiClient.delete('/api/workspace/directory', {
      params: { path: dirPath },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting workspace directory ${dirPath}:`, error);
    throw error;
  }
};

export default apiClient;
