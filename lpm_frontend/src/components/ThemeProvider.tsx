import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // ローカルストレージからテーマを取得するか、デフォルトのテーマを使用
  const [theme, setTheme] = useState<Theme>('light');
  
  // 初期化時に実行
  useEffect(() => {
    // ローカルストレージからテーマを取得
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // システムの設定を確認
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // ローカルストレージに保存されたテーマがあればそれを使用し、
    // なければシステムの設定に基づいてテーマを設定
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // HTML要素にデータ属性を設定
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    // ダークモードの場合はclassを追加
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  // テーマを切り替える関数
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // ローカルストレージに新しいテーマを保存
      localStorage.setItem('theme', newTheme);
      
      // HTML要素にデータ属性を設定
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // classを追加/削除
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newTheme;
    });
  };
  
  // 特定のテーマを設定する関数
  const handleSetTheme = (newTheme: Theme) => {
    // ローカルストレージに新しいテーマを保存
    localStorage.setItem('theme', newTheme);
    
    // HTML要素にデータ属性を設定
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // classを追加/削除
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setTheme(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
