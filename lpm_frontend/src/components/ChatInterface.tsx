import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  className?: string;
}

/**
 * チャットインターフェースコンポーネント
 * Second Meとの対話機能を提供
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // チャット履歴が更新されたら自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // ユーザーメッセージをチャット履歴に追加
    const userMessage: Message = { role: 'user', content: message };
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

  // Enterキーでメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
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
        
        {/* ローディングインジケーター */}
        {loading && (
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

export default ChatInterface;
