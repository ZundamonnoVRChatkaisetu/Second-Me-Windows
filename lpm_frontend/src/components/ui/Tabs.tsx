import React, { createContext, useContext, useState } from 'react';

// タブコンテキストを作成
interface TabsContextProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps>({
  value: '',
  onValueChange: () => {},
});

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
interface TabsTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
}
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

/**
 * Tabs コンポーネント
 * タブ付きのインターフェースを提供
 */
const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  className = '',
  children,
  ...props
}) => {
  // 内部ステートまたは外部から提供された値を使用
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || '');
  
  // タブの値を管理する関数
  const handleValueChange = (tabValue: string) => {
    if (onValueChange) {
      onValueChange(tabValue);
    } else {
      setSelectedValue(tabValue);
    }
  };

  // コンテキストの値
  const contextValue = {
    value: value !== undefined ? value : selectedValue,
    onValueChange: handleValueChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * TabsList コンポーネント
 * タブのトリガーをグループ化するコンテナ
 */
const TabsList: React.FC<TabsListProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 dark:bg-gray-800 ${className}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * TabsTrigger コンポーネント
 * 個々のタブのトリガーボタン
 */
const TabsTrigger: React.FC<TabsTriggerProps> = ({
  className = '',
  value,
  children,
  ...props
}) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
        ${
          isSelected
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
        } 
        ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * TabsContent コンポーネント
 * 個々のタブのコンテンツ
 */
const TabsContent: React.FC<TabsContentProps> = ({
  className = '',
  value,
  children,
  ...props
}) => {
  const { value: selectedValue } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? 'active' : 'inactive'}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
