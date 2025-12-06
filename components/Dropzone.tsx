import React, { useRef, useState } from 'react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!isLoading ? handleClick : undefined}
      className={`
        relative group cursor-pointer 
        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        flex flex-col items-center justify-center h-64
        ${isDragging 
          ? 'border-brand-500 bg-brand-500/10' 
          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-brand-400'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
        className="hidden"
        accept=".xml,.gz,.txt"
      />
      
      <div className="bg-gray-700 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        {isLoading ? 'Processing...' : 'Upload Sitemap'}
      </h3>
      <p className="text-gray-400 text-sm max-w-sm">
        Drag and drop your <span className="text-brand-400 font-mono">.xml</span> or <span className="text-brand-400 font-mono">.gz</span> file here.
        <br />
        <span className="text-xs text-gray-500 mt-2 block">Supports massive files (millions of URLs)</span>
      </p>
    </div>
  );
};
