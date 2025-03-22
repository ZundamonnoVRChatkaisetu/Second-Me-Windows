import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Button } from './ui/button';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  details?: any;
}

/**
 * Ollamaからモデル一覧を取得し、選択可能なUIを提供するコンポーネント
 */
const ModelSelector: React.FC = () => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  // コンポーネント初期化時にモデル一覧を取得
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/ollama/models');
        setModels(response.data.models || []);
        
        // デフォルトでモデルが存在すれば最初のものを選択
        if (response.data.models && response.data.models.length > 0) {
          setSelectedModel(response.data.models[0].name);
        }
      } catch (err: any) {
        console.error('Failed to fetch Ollama models:', err);
        setError('Ollamaモデルの取得に失敗しました。Ollamaが起動していることを確認してください。');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // 選択したモデルを適用する
  const applySelectedModel = async () => {
    if (!selectedModel) return;
    
    try {
      setApplying(true);
      setError(null);
      setSuccess(false);
      
      await axios.post('/api/ollama/set-model', { model_name: selectedModel });
      
      setSuccess(true);
      // 3秒後に成功メッセージを非表示
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to apply model:', err);
      setError('モデルの適用に失敗しました。サーバーの状態を確認してください。');
    } finally {
      setApplying(false);
    }
  };

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Ollamaモデル選択</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          <span>モデル一覧を取得中...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : models.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          利用可能なモデルがありません。Ollamaにモデルをインストールしてください。
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <div>
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
                利用可能なモデル
              </label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue placeholder="モデルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name} ({formatSize(model.size)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={applySelectedModel} disabled={!selectedModel || applying}>
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  適用中...
                </>
              ) : (
                '選択したモデルを適用'
              )}
            </Button>
            
            {success && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-2" />
                モデルが正常に適用されました！
              </div>
            )}
          </div>
          
          {/* 選択されたモデルの詳細情報（任意） */}
          {selectedModel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">選択されたモデル情報</h4>
              <p className="text-sm text-gray-600">
                名前: {selectedModel}
              </p>
              <p className="text-sm text-gray-600">
                サイズ: {formatSize(models.find(m => m.name === selectedModel)?.size || 0)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelSelector;
