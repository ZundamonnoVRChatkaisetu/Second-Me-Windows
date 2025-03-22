import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);

  // バックエンドのヘルスチェック
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/health');
        setStatus(response.data);
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30秒ごとに確認
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // ユーザーメッセージをチャット履歴に追加
    const userMessage = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // APIリクエスト
      const response = await axios.post('/api/chat', { message: userMessage.content });
      
      // AIの応答をチャット履歴に追加
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
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

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Second Me - Windows</h1>
          <p className="text-gray-600 dark:text-gray-300">
            あなた自身のAI自己をWindowsで実現
          </p>
          
          {/* ステータスインジケーター */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {status 
                ? `接続済み (v${status.version} - Uptime: ${Math.floor(status.uptime / 60)} min)` 
                : 'バックエンド未接続'}
            </span>
          </div>
        </header>

        {/* チャットエリア */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="h-96 overflow-y-auto mb-4 p-2">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <p>メッセージを送信してSecond Meと会話を始めましょう</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg max-w-3/4 ${
                      chat.role === 'user'
                        ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
                        : 'bg-gray-100 dark:bg-gray-700 mr-auto'
                    }`}
                  >
                    {chat.content}
                  </div>
                ))}
                {loading && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-3/4 mr-auto">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 入力エリア */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="メッセージを入力..."
              className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </div>

        {/* フッター */}
        <footer className="text-center text-sm text-gray-500 mt-8">
          <p>© 2025 Second Me Windows - <a href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" target="_blank" rel="noopener noreferrer" className="underline">GitHub</a></p>
        </footer>
      </div>
    </main>
  );
}
