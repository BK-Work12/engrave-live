import React, { useCallback, useState } from 'react';

export function DropZone({ onFileSelect }) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')) {
                onFileSelect(file);
            } else {
                alert("Please upload an image file (JPG, PNG, SVG).");
            }
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative w-full h-64 sm:h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                ${isDragOver 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                }
            `}
        >
            <input
                type="file"
                accept="image/*,.svg"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="flex flex-col items-center space-y-4 p-6 text-center pointer-events-none">
                <div className={`p-4 rounded-full ${isDragOver ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <p className="text-lg font-medium text-slate-200">
                        {isDragOver ? 'Drop image here' : 'Click or Drag image here'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        Supports JPG, PNG, WEBP, SVG
                    </p>
                </div>
            </div>
        </div>
    );
}
