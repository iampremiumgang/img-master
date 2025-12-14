
import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { UploadIcon, TrashIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (imageFile: ImageFile | null) => void;
  image: ImageFile | null;
  title: string;
  id: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, image, title, id, className = "" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload({ file, base64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageUpload(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        {image && (
             <button 
                onClick={handleRemove}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
             >
                 <TrashIcon className="w-3 h-3" /> Remove
             </button>
        )}
      </div>
      <div 
        className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden h-52 flex justify-center items-center cursor-pointer
            ${image ? 'border-primary/50 bg-surface' : 'border-border bg-surface/50 hover:bg-surface hover:border-primary/50'}
            ${isDragging ? 'border-primary bg-primary/10' : ''}
        `}
        onClick={() => !image && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {image ? (
            <div className="relative w-full h-full group">
                <img 
                    src={image.base64} 
                    alt="Preview" 
                    className="w-full h-full object-contain p-2" 
                />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium">Click to replace</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        aria-label="Replace image"
                    />
                </div>
            </div>
        ) : (
          <div className="text-center p-6 transition-transform duration-300 group-hover:scale-105">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-surface-hover text-gray-400'}`}>
                <UploadIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-300">
                {isDragging ? "Drop to upload" : "Click or drag image"}
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;