import React, { useState, useRef, useEffect, useCallback } from 'react';

export function ComparisonViewer({ originalSrc, outlineSrc }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const outlineRef = useRef(null);

    const handleMouseDown = useCallback(() => setIsResizing(true), []);
    const handleMouseUp = useCallback(() => setIsResizing(false), []);
    
    const handleMove = useCallback((clientX) => {
        if (!isResizing || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    }, [isResizing]);

    const handleMouseMove = useCallback((e) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsResizing(false);
            setIsPanning(false);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, []);

    // Zoom handlers
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 5)); // Max 5x zoom
    };

    const handleZoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 0.25, 1); // Min 1x zoom (original size)
            if (newZoom === 1) {
                setPan({ x: 0, y: 0 }); // Reset pan when zoom is reset
            }
            return newZoom;
        });
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => {
                const newZoom = Math.max(1, Math.min(5, prev + delta)); // Min 1x (original size)
                if (newZoom === 1) {
                    setPan({ x: 0, y: 0 });
                }
                return newZoom;
            });
        }
    }, []);

    // Pan handlers
    const handlePanStart = useCallback((e) => {
        if (zoom > 1) {
            setIsPanning(true);
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
        }
    }, [zoom, pan]);

    const handlePanMove = useCallback((e) => {
        if (isPanning && zoom > 1) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setPan({
                x: clientX - panStart.x,
                y: clientY - panStart.y
            });
        }
    }, [isPanning, panStart]);

    return (
        <div className="w-full h-full flex flex-col">
            <div 
                ref={containerRef}
                className="relative w-full aspect-square sm:aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none shadow-2xl bg-slate-800 border border-slate-700"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                {/* Background Image (Original) */}
                <img 
                    src={originalSrc} 
                    alt="Original" 
                    className="absolute top-0 left-0 w-full h-full object-contain select-none"
                />

                {/* Foreground Image (Outline) - Clipped */}
                <div 
                    className="absolute top-0 left-0 h-full w-full overflow-hidden bg-white/5"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <div
                        ref={outlineRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                        }}
                        onMouseDown={handlePanStart}
                        onTouchStart={handlePanStart}
                        onMouseMove={handlePanMove}
                        onTouchMove={handlePanMove}
                        onWheel={handleWheel}
                    >
                        <img 
                            src={outlineSrc} 
                            alt="Outline" 
                            className="w-full h-full object-contain select-none" 
                        />
                    </div>
                </div>

                {/* Slider Handle */}
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-indigo-500 cursor-ew-resize shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10 hover:bg-indigo-400 transition-colors"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </div>
                </div>
                
                {/* Labels */}
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    Outline
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    Original
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs text-slate-400 px-1">
                 <span>Slide to compare</span>
                 <div className="flex items-center gap-2">
                     <span>{Math.round(sliderPosition)}% Outline</span>
                     {zoom !== 1 && (
                         <span className="text-indigo-400">• Zoom: {Math.round(zoom * 100)}%</span>
                     )}
                 </div>
            </div>
            
            {/* Zoom Controls */}
            <div className="mt-2 flex justify-center gap-2">
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors flex items-center gap-1"
                    title="Zoom Out"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                    Out
                </button>
                <button
                    onClick={handleResetZoom}
                    disabled={zoom === 1}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
                    title="Reset Zoom"
                >
                    Reset
                </button>
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors flex items-center gap-1"
                    title="Zoom In"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                    In
                </button>
            </div>
            {zoom > 1 && (
                <p className="mt-2 text-xs text-slate-500 text-center">
                    Drag to pan • Use Ctrl/Cmd + Scroll to zoom
                </p>
            )}
        </div>
    );
}
