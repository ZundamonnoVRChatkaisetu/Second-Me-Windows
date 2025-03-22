import React, { useState, useEffect } from 'react';
import { 
  listWorkSpaceFiles, 
  getWorkSpaceFile, 
  createWorkSpaceFile, 
  updateWorkSpaceFile, 
  deleteWorkSpaceFile,
  createWorkSpaceDirectory,
  deleteWorkSpaceDirectory
} from '../lib/api-client';

type FileItem = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified_at: string;
  preview?: string;
};

type DirectoryInfo = {
  path: string;
  parent: string | null;
};

type WorkSpaceExplorerProps = {
  onFileSelect?: (file: { name: string; path: string; content: string }) => void;
};

const WorkSpaceExplorer: React.FC<WorkSpaceExplorerProps> = ({ onFileSelect }) => {
  const [currentDir, setCurrentDir] = useState<DirectoryInfo>({ path: '', parent: null });
  const [directories, setDirectories] = useState<FileItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新規ファイル・ディレクトリ作成用の状態
  const [showNewFileForm, setShowNewFileForm] = useState<boolean>(false);
  const [showNewDirForm, setShowNewDirForm] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newDirName, setNewDirName] = useState<string>('');

  // ディレクトリ内容を読み込む関数
  const loadDirectory = async (dirPath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listWorkSpaceFiles(dirPath);
      
      setCurrentDir(response.current_dir);
      setDirectories(response.directories || []);
      setFiles(response.files || []);
      
      // ファイル選択状態をリセット
      setSelectedFile(null);
      setFileContent('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to load workspace directory:', err);
      setError('ディレクトリの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回マウント時にルートディレクトリを読み込む
  useEffect(() => {
    loadDirectory();
  }, []);

  // ファイル内容を読み込む関数
  const loadFile = async (filePath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getWorkSpaceFile(filePath);
      setFileContent(response.file.content);
      setSelectedFile(filePath);
      setIsEditing(false);

      // コールバックがあれば呼び出す
      if (onFileSelect) {
        onFileSelect({
          name: response.file.name,
          path: response.file.path,
          content: response.file.content,
        });
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setError('ファイルの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルを保存する関数
  const saveFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await updateWorkSpaceFile(selectedFile, fileContent);
      setIsEditing(false);
      // 更新された内容を反映するためにディレクトリを再読み込み
      await loadDirectory(currentDir.path);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError('ファイルの保存に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 新しいファイルを作成する関数
  const createFile = async () => {
    if (!newFileName.trim()) return;
    
    setIsLoading(true);
    setError(null);

    const filePath = currentDir.path 
      ? `${currentDir.path}/${newFileName}` 
      : newFileName;

    try {
      await createWorkSpaceFile(filePath, '');
      setShowNewFileForm(false);
      setNewFileName('');
      // 作成されたファイルが表示されるようにディレクトリを再読み込み
      await loadDirectory(currentDir.path);
    } catch (err) {
      console.error('Failed to create file:', err);
      setError('ファイルの作成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 新しいディレクトリを作成する関数
  const createDirectory = async () => {
    if (!newDirName.trim()) return;
    
    setIsLoading(true);
    setError(null);

    const dirPath = currentDir.path 
      ? `${currentDir.path}/${newDirName}` 
      : newDirName;

    try {
      await createWorkSpaceDirectory(dirPath);
      setShowNewDirForm(false);
      setNewDirName('');
      // 作成されたディレクトリが表示されるようにディレクトリを再読み込み
      await loadDirectory(currentDir.path);
    } catch (err) {
      console.error('Failed to create directory:', err);
      setError('ディレクトリの作成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルを削除する関数
  const deleteFile = async (filePath: string) => {
    if (!confirm(`ファイル "${filePath}" を削除しますか？`)) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await deleteWorkSpaceFile(filePath);
      
      // 削除したファイルが選択中のファイルだった場合は選択解除
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setFileContent('');
        setIsEditing(false);
      }
      
      // 削除後のファイル一覧を再読み込み
      await loadDirectory(currentDir.path);
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('ファイルの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ディレクトリを削除する関数
  const deleteDirectory = async (dirPath: string) => {
    if (!confirm(`ディレクトリ "${dirPath}" とその中のすべてのファイルを削除しますか？`)) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await deleteWorkSpaceDirectory(dirPath);
      // 削除後のディレクトリ一覧を再読み込み
      await loadDirectory(currentDir.path);
    } catch (err) {
      console.error('Failed to delete directory:', err);
      setError('ディレクトリの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 親ディレクトリに遷移する関数
  const navigateToParent = () => {
    if (currentDir.parent !== null) {
      loadDirectory(currentDir.parent);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">WorkSpace エクスプローラー</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewFileForm(true)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            新規ファイル
          </button>
          <button
            onClick={() => setShowNewDirForm(true)}
            className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            新規フォルダ
          </button>
        </div>
      </div>

      {/* パンくずリスト */}
      <div className="bg-gray-50 dark:bg-gray-700 p-2 border-b flex items-center space-x-1 overflow-x-auto">
        <button
          onClick={() => loadDirectory('')}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          WorkSpace
        </button>
        
        {currentDir.path && (
          <>
            <span>/</span>
            {currentDir.path.split('/').map((part, index, arr) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => loadDirectory(arr.slice(0, index + 1).join('/'))}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {part}
                </button>
                {index < arr.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2">
          <p>{error}</p>
        </div>
      )}

      {/* 新規ファイル作成フォーム */}
      {showNewFileForm && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="ファイル名"
              className="flex-1 px-3 py-2 border rounded dark:bg-gray-800"
              autoFocus
            />
            <button
              onClick={createFile}
              disabled={!newFileName.trim()}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400"
            >
              作成
            </button>
            <button
              onClick={() => setShowNewFileForm(false)}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 新規ディレクトリ作成フォーム */}
      {showNewDirForm && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="フォルダ名"
              className="flex-1 px-3 py-2 border rounded dark:bg-gray-800"
              autoFocus
            />
            <button
              onClick={createDirectory}
              disabled={!newDirName.trim()}
              className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
            >
              作成
            </button>
            <button
              onClick={() => setShowNewDirForm(false)}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ファイルツリー */}
        <div className="w-1/3 border-r overflow-y-auto">
          {isLoading && <p className="p-4 text-gray-500">読み込み中...</p>}
          
          {/* 親ディレクトリに戻るボタン */}
          {currentDir.parent !== null && (
            <div
              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b"
              onClick={navigateToParent}
            >
              <span className="mr-2">⬆️</span>
              <span>上の階層へ</span>
            </div>
          )}
          
          {/* ディレクトリ一覧 */}
          {directories.length > 0 && (
            <div className="border-b">
              {directories.map((dir) => (
                <div
                  key={dir.path}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b"
                >
                  <div
                    className="flex items-center flex-1"
                    onClick={() => loadDirectory(dir.path)}
                  >
                    <span className="mr-2">📁</span>
                    <span>{dir.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDirectory(dir.path);
                    }}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* ファイル一覧 */}
          {files.map((file) => (
            <div
              key={file.path}
              className={`flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b ${
                selectedFile === file.path ? 'bg-blue-100 dark:bg-blue-800' : ''
              }`}
            >
              <div
                className="flex items-center flex-1"
                onClick={() => loadFile(file.path)}
              >
                <span className="mr-2">📄</span>
                <span>{file.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file.path);
                }}
                className="text-red-500 hover:text-red-700 px-2"
              >
                🗑️
              </button>
            </div>
          ))}
          
          {!isLoading && directories.length === 0 && files.length === 0 && (
            <p className="p-4 text-gray-500">ファイルがありません</p>
          )}
        </div>
        
        {/* ファイル内容表示/編集 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 border-b flex justify-between items-center">
                <div className="font-medium">{selectedFile.split('/').pop()}</div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveFile}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          // 編集をキャンセルして元の内容に戻す
                          loadFile(selectedFile);
                        }}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded text-sm"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none dark:bg-gray-800"
                />
              ) : (
                <pre className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap dark:bg-gray-800">
                  {fileContent}
                </pre>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>ファイルを選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSpaceExplorer;
