import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/Button';
import LlamaCppSetupGuide from './LlamaCppSetupGuide';
import ModelSettingsDialog from './ModelSettingsDialog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamingChatInterfaceProps {
  className?: string;
}

/**
 * ストリーミング対応チャットインターフェースコンポーネント
 * Second Meとの対話機能を提供、リアルタイムでのレスポンス表示に対応
 */
const StreamingChatInterface: React.FC<StreamingChatInterfaceProps> = ({ className = '' }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // チャット履歴が更新されたら自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingResponse]);

  // コンポーネントがアンマウントされたときにEventSourceをクリーンアップ
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // ユーザーメッセージをチャット履歴に追加
    const userMessage: Message = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    // 以前のストリーミングレスポンスをクリア
    setStreamingResponse('');

    try {
      if (useStreaming) {
        // ストリーミングモードでAPIリクエスト
        await handleStreamingRequest(userMessage.content);
      } else {
        // 通常モードでAPIリクエスト
        await handleNormalRequest(userMessage.content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'エラーが発生しました。しばらくしてからお試しください。'
        }
      ]);
      setLoading(false);
    }
  };

  // 通常の（非ストリーミング）リクエスト処理
  const handleNormalRequest = async (content: string) => {
    try {
      const response = await axios.post('/api/chat', { 
        message: content,
        stream: false
      });
      
      // llama.cppセットアップエラーのチェック
      if (response.data.message.includes("llama.cpp実行ファイルが見つかりません")) {
        setSetupError("llama.cpp実行ファイルが見つかりません");
        setLoading(false);
        return;
      }
      
      // AIの応答をチャット履歴に追加
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ]);
    } catch (error) {
      console.error('Error in normal request:', error);
      setChatHistory((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'エラーが発生しました。しばらくしてからお試しください。' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ストリーミングリクエスト処理
  const handleStreamingRequest = async (content: string) => {
    // 既存のEventSourceがあれば閉じる
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // URLエンコードしたメッセージでクエリパラメータを作成
    const params = new URLSearchParams({ message: content });
    const streamUrl = `/api/chat/stream?${params.toString()}`;

    // Server-Sent Eventsを使用してストリーミングレスポンスを受信
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    let fullResponse = '';

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // エラーがあった場合の処理
        if (data.error) {
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: data.text || 'エラーが発生しました' }
          ]);
          setLoading(false);
          eventSource.close();
          return;
        }

        // ストリーミングデータの処理
        if (data.text) {
          fullResponse += data.text;
          setStreamingResponse(fullResponse);
        }

        // 完了フラグがある場合
        if (data.finish) {
          // 完了したレスポンスをチャット履歴に追加
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: data.buffer || fullResponse }
          ]);
          setStreamingResponse('');
          setLoading(false);
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing streaming response:', error, event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setChatHistory((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'ストリーミング中にエラーが発生しました。しばらくしてからお試しください。' 
        }
      ]);
      setLoading(false);
      eventSource.close();
    };
  };

  // Enterキーでメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // llama.cppセットアップエラーが発生した場合はセットアップガイドを表示
  if (setupError) {
    return <LlamaCppSetupGuide />;
  }

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* モデル設定ダイアログ */}
      <ModelSettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseStreaming(!useStreaming)}
            className="text-xs"
          >
            {useStreaming ? 'ストリーミング: ON' : 'ストリーミング: OFF'}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          className="text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          モデル設定
        </Button>
      </div>
      
      {/* チャット履歴表示エリア */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ minHeight: '350px', maxHeight: '500px' }}
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-400"></div>
            </div>
            <p className="text-lg font-medium mb-2">Second Me へようこそ</p>
            <p>メッセージを送信して対話を始めましょう</p>
          </div>
        ) : (
          chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative max-w-md rounded-lg px-4 py-2 ${
                  chat.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
              >
                {chat.content}
              </div>
            </div>
          ))
        )}
        
        {/* ストリーミングレスポンス表示エリア */}
        {streamingResponse && (
          <div className="flex justify-start">
            <div
              className="relative max-w-md rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
            >
              {streamingResponse}
              <span className="animate-pulse ml-1">▌</span>
            </div>
          </div>
        )}
        
        {/* ローディングインジケーター (非ストリーミング時のみ表示) */}
        {loading && !streamingResponse && (
          <div className="flex justify-start">
            <div className="relative max-w-md rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={2}
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="h-10 px-4"
          >
            送信
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Enterキーで送信。Shift+Enterで改行。</p>
      </div>
    </div>
  );
};

export default StreamingChatInterface;
