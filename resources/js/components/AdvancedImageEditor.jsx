import React, { useRef, useState, useEffect } from "react";

export default function AdvancedImageEditor({ imageUrl, onSave, autoOpen = false, showCloseButton = true, onClose = null }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isEditing, setIsEditing] = useState(autoOpen);
    const [tool, setTool] = useState("pen"); // pen, eraser, fill, brush
    const [penColor, setPenColor] = useState("#000000");
    const [penSize, setPenSize] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalImageData, setOriginalImageData] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    
    // Background and zoom
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(false);
    
    // Color adjustments
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [hue, setHue] = useState(0);
    
    useEffect(() => {
        if (imageUrl && isEditing) {
            loadImageToCanvas();
        }
    }, [imageUrl, isEditing]);

    useEffect(() => {
        if (canvasRef.current && isEditing) {
            applyFiltersPreview();
        }
    }, [brightness, contrast, saturation, hue]);

    const saveToHistory = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(canvas.toDataURL());
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            loadHistoryState(history[prevStep]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            loadHistoryState(history[nextStep]);
        }
    };

    const loadHistoryState = (dataUrl) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    };

    const loadImageToCanvas = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Store original image data
            setOriginalImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
            
            // Save initial state to history
            const initialState = canvas.toDataURL();
            setHistory([initialState]);
            setHistoryStep(0);
        };
        img.onerror = () => {
            console.error("Failed to load image");
            alert("Failed to load image. Please try again.");
        };
        img.src = imageUrl;
    };

    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const ctx = canvas.getContext("2d");
        
        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(x, y, penSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
        } else if (tool === "pen" || tool === "brush") {
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    const applyFiltersPreview = () => {
        if (!originalImageData || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        // Start with original image
        ctx.putImageData(originalImageData, 0, 0);
        
        // Get current image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Apply brightness
            if (brightness !== 0) {
                r = Math.min(255, Math.max(0, r + brightness));
                g = Math.min(255, Math.max(0, g + brightness));
                b = Math.min(255, Math.max(0, b + brightness));
            }

            // Apply contrast
            if (contrast !== 0) {
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }

            // Apply saturation
            if (saturation !== 0) {
                const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                const satFactor = (saturation + 100) / 100;
                r = Math.min(255, Math.max(0, gray + (r - gray) * satFactor));
                g = Math.min(255, Math.max(0, gray + (g - gray) * satFactor));
                b = Math.min(255, Math.max(0, gray + (b - gray) * satFactor));
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const applyEdits = async () => {
        if (!canvasRef.current) return;

        setIsProcessing(true);
        try {
            const canvas = canvasRef.current;
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                if (onSave) {
                    onSave(url, blob);
                }
                setIsEditing(false);
            }, "image/png");
        } catch (error) {
            console.error("Error applying edits:", error);
            alert("Error applying edits: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetImage = () => {
        setTool("pen");
        setPenColor("#000000");
        setPenSize(2);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setHue(0);
        setZoom(1);
        setBackgroundColor("#ffffff");
        loadImageToCanvas();
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
                </svg>
                Open Editor
            </button>
        );
    }

    const editorContent = (
        <div className="w-full h-full flex flex-col lg:flex-row gap-4">
            {/* Left Sidebar - Tools */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                {/* Tools Panel */}
                <div className="bg-[#1F1E1E] rounded-xl p-4 border border-[#2F2E2E]">
                    <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
                        </svg>
                        Drawing Tools
                    </h4>
                    <div className="space-y-2">
                        {[
                            { id: "pen", name: "Pen", icon: "✏️" },
                            { id: "brush", name: "Brush", icon: "🖌️" },
                            { id: "eraser", name: "Eraser", icon: "🧹" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTool(t.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    tool === t.id
                                        ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg"
                                        : "bg-[#2F2E2E] text-[#D6D6D6] hover:bg-[#3F3E3E]"
                                }`}
                            >
                                <span className="mr-2">{t.icon}</span>
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="bg-[#1F1E1E] rounded-xl p-4 border border-[#2F2E2E]">
                    <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.6 8.4l4.2-4.2" />
                        </svg>
                        Properties
                    </h4>
                    <div className="space-y-4">
                        {tool !== "eraser" && (
                            <div>
                                <label className="text-[#B0B0B0] text-xs font-medium block mb-2">Drawing Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={penColor}
                                        onChange={(e) => setPenColor(e.target.value)}
                                        className="w-14 h-10 rounded-lg cursor-pointer border-2 border-[#3F3E3E]"
                                    />
                                    <input
                                        type="text"
                                        value={penColor}
                                        onChange={(e) => setPenColor(e.target.value)}
                                        className="flex-1 bg-[#2F2E2E] text-white px-3 py-2 rounded-lg border border-[#3F3E3E] text-xs font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[#B0B0B0] text-xs font-medium block mb-2">
                                Brush Size: <span className="text-white font-semibold">{penSize}px</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={penSize}
                                onChange={(e) => setPenSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#2F2E2E] rounded-full appearance-none cursor-pointer slider-thumb"
                            />
                            <div className="flex justify-between text-[#6B7280] text-xs mt-1">
                                <span>1px</span>
                                <span>100px</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[#B0B0B0] text-xs font-medium block mb-2">Canvas Background</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-14 h-10 rounded-lg cursor-pointer border-2 border-[#3F3E3E]"
                                />
                                <input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="flex-1 bg-[#2F2E2E] text-white px-3 py-2 rounded-lg border border-[#3F3E3E] text-xs font-mono"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Adjustments Panel */}
                <div className="bg-[#1F1E1E] rounded-xl p-4 border border-[#2F2E2E]">
                    <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        Adjustments
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[#B0B0B0] text-xs font-medium block mb-1.5">
                                Brightness: <span className="text-white font-semibold">{brightness}</span>
                            </label>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={brightness}
                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#2F2E2E] rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-[#B0B0B0] text-xs font-medium block mb-1.5">
                                Contrast: <span className="text-white font-semibold">{contrast}</span>
                            </label>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={contrast}
                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#2F2E2E] rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-[#B0B0B0] text-xs font-medium block mb-1.5">
                                Saturation: <span className="text-white font-semibold">{saturation}</span>
                            </label>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={saturation}
                                onChange={(e) => setSaturation(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#2F2E2E] rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={() => {
                                setBrightness(0);
                                setContrast(0);
                                setSaturation(0);
                                setHue(0);
                            }}
                            className="w-full mt-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        >
                            Reset Adjustments
                        </button>
                    </div>
                </div>
            </div>

            {/* Center - Canvas Area */}
            <div className="flex-1 flex flex-col min-h-[500px]">
                {/* Top Toolbar */}
                <div className="bg-[#1F1E1E] rounded-xl p-3 mb-4 border border-[#2F2E2E]">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={undo}
                                disabled={historyStep <= 0}
                                className="p-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                title="Undo (Ctrl+Z)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7v6h6" />
                                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                                </svg>
                            </button>
                            <button
                                onClick={redo}
                                disabled={historyStep >= history.length - 1}
                                className="p-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                                title="Redo (Ctrl+Y)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 7v6h-6" />
                                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                                </svg>
                            </button>
                            <div className="w-px h-6 bg-[#3F3E3E] mx-1"></div>
                            <button
                                onClick={clearCanvas}
                                className="p-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white rounded-lg transition-all"
                                title="Clear Canvas"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[#B0B0B0] text-xs">Zoom:</span>
                            <button
                                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                                className="p-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white rounded-lg transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M8 11h6" />
                                </svg>
                            </button>
                            <span className="text-white text-sm font-mono min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                className="p-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white rounded-lg transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M11 8v6M8 11h6" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setZoom(1)}
                                className="px-3 py-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white rounded-lg text-xs transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas Container */}
                <div 
                    ref={containerRef}
                    className="flex-1 rounded-xl overflow-auto border-2 border-[#2F2E2E] flex items-center justify-center p-4"
                    style={{ backgroundColor: backgroundColor }}
                >
                    <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="cursor-crosshair shadow-2xl"
                            style={{ 
                                maxWidth: '100%',
                                imageRendering: 'crisp-edges',
                                border: '1px solid #3F3E3E'
                            }}
                        />
                    </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={resetImage}
                        className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                        </svg>
                        Reset All
                    </button>
                    <button
                        onClick={applyEdits}
                        disabled={isProcessing}
                        className="flex-[2] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4de8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {isProcessing ? "Processing..." : "Apply & Download"}
                    </button>
                    {showCloseButton && (
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                if (onClose) onClose();
                            }}
                            disabled={isProcessing}
                            className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // If autoOpen is true, render without modal wrapper (for use in external modals)
    if (autoOpen) {
        return <div className="w-full h-full min-h-[600px]">{editorContent}</div>;
    }

    // Otherwise, render with modal wrapper as before
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0D0D0D] rounded-2xl max-w-[95vw] w-full h-[90vh] overflow-hidden">
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl text-white font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
                            </svg>
                            Professional Image Editor
                        </h3>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                if (onClose) onClose();
                            }}
                            className="text-[#808080] hover:text-white transition-colors p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {editorContent}
                    </div>
                </div>
            </div>
        </div>
    );
}

