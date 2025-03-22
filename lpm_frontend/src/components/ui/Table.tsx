import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {}

/**
 * Table コンポーネント
 * データをテーブル形式で表示する
 */
const Table: React.FC<TableProps> = ({ className = '', children, ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

/**
 * TableHeader コンポーネント
 * テーブルのヘッダー部分
 */
const TableHeader: React.FC<TableHeaderProps> = ({ className = '', children, ...props }) => {
  return (
    <thead className={`${className} border-b border-gray-200 dark:border-gray-700`} {...props}>
      {children}
    </thead>
  );
};

/**
 * TableBody コンポーネント
 * テーブルのボディ部分
 */
const TableBody: React.FC<TableBodyProps> = ({ className = '', children, ...props }) => {
  return (
    <tbody className={`${className} divide-y divide-gray-200 dark:divide-gray-700`} {...props}>
      {children}
    </tbody>
  );
};

/**
 * TableFooter コンポーネント
 * テーブルのフッター部分
 */
const TableFooter: React.FC<TableFooterProps> = ({ className = '', children, ...props }) => {
  return (
    <tfoot
      className={`border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  );
};

/**
 * TableHead コンポーネント
 * テーブルの列見出し
 */
const TableHead: React.FC<TableHeadProps> = ({ className = '', children, ...props }) => {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

/**
 * TableRow コンポーネント
 * テーブルの行
 */
const TableRow: React.FC<TableRowProps> = ({ className = '', children, ...props }) => {
  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-gray-50 dark:data-[state=selected]:bg-gray-800 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

/**
 * TableCell コンポーネント
 * テーブルのセル
 */
const TableCell: React.FC<TableCellProps> = ({ className = '', children, ...props }) => {
  return (
    <td
      className={`px-4 py-3 align-middle ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell
};
