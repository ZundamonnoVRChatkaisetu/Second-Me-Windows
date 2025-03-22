import React from 'react';
import Image from 'next/image';

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  imageSrc: string;
}

/**
 * Second Meのセットアップステップを表示するカードコンポーネント
 */
const StepCard: React.FC<StepCardProps> = ({ number, title, description, imageSrc }) => {
  return (
    <div className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative w-full h-40">
        {/* ステップ番号 */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-medium text-sm z-10">
          {number}
        </div>
        
        {/* 画像 */}
        <div className="w-full h-full relative">
          {imageSrc ? (
            <Image 
              src={imageSrc} 
              alt={`Step ${number}`}
              layout="fill"
              objectFit="cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              画像なし
            </div>
          )}
        </div>
      </div>
      
      {/* コンテンツ */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-600 flex-1">{description}</p>
      </div>
    </div>
  );
};

export default StepCard;
