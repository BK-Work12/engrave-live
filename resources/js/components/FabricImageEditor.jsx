import React, { useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as fabric from "fabric";

export default function FabricImageEditor({ imageUrl, onSave }) {
    console.log('FabricImageEditor rendered with imageUrl:', imageUrl);
    
    // Don't render if no imageUrl
    if (!imageUrl) {
        return null;
    }
    
    const modalRootRef = useRef(null);
    const reactRootRef = useRef(null);
    
    const openEditor = () => {
        // Create a container div for the modal
        if (!modalRootRef.current) {
            const modalDiv = document.createElement('div');
            modalDiv.id = 'fabric-editor-root';
            document.body.appendChild(modalDiv);
            modalRootRef.current = modalDiv;
        }
        
        // Create React root and render modal
        if (!reactRootRef.current) {
            reactRootRef.current = createRoot(modalRootRef.current);
        }
        
        reactRootRef.current.render(
            <EditorModal 
                imageUrl={imageUrl} 
                onClose={() => closeEditor()} 
                onSave={(url, blob) => {
                    if (onSave) onSave(url, blob);
                    closeEditor();
                }}
            />
        );
    };
    
    const closeEditor = () => {
        if (reactRootRef.current && modalRootRef.current) {
            reactRootRef.current.unmount();
            reactRootRef.current = null;
            
            if (modalRootRef.current.parentNode) {
                modalRootRef.current.parentNode.removeChild(modalRootRef.current);
            }
            modalRootRef.current = null;
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            closeEditor();
        };
    }, []);
    
    return (
        <button
            onClick={openEditor}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
            </svg>
            Full Editor
        </button>
    );
}

function EditorModal({ imageUrl, onClose, onSave }) {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tool, setTool] = useState("select");
    const [drawColor, setDrawColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState(2);
    
    // Color replacement
    const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
    const [lineColor, setLineColor] = useState("#000000");
    const [borderMm, setBorderMm] = useState(0);
    
    // Adjustments
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);

    useEffect(() => {
        let mounted = true;
        
        if (canvasRef.current && !fabricCanvasRef.current && mounted) {
            console.log('Editor opened, initializing fabric canvas...');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (mounted && canvasRef.current) {
                    initializeFabric();
                }
            }, 100);
        }
        
        // Handle Escape key to close modal
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeEditor();
            }
        };
        
        window.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        return () => {
            mounted = false;
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (fabricCanvasRef.current) {
                try {
                    fabricCanvasRef.current.dispose();
                    fabricCanvasRef.current = null;
                } catch (error) {
                    console.error('Error disposing canvas on unmount:', error);
                }
            }
        };
    }, []);

    const initializeFabric = () => {
        console.log('=== initializeFabric called ===');
        console.log('canvasRef.current:', canvasRef.current);
        console.log('imageUrl:', imageUrl);
        
        if (!canvasRef.current) {
            console.error('Canvas ref is null!');
            alert('Canvas element not found. Please try again.');
            onClose();
            return;
        }
        
        setIsLoading(true);
        
        try {
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: 800,
                height: 600,
                backgroundColor: '#ffffff'
            });
            fabricCanvasRef.current = canvas;
            console.log('Fabric canvas created successfully');

            // Load the image - don't use crossOrigin for local images
            const isExternalImage = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
            const loadOptions = isExternalImage ? { crossOrigin: 'anonymous' } : {};
            
            console.log('Loading image with options:', loadOptions);
            
            fabric.Image.fromURL(imageUrl, (img, isError) => {
            if (isError) {
                console.error('Failed to load image:', imageUrl);
                alert('Failed to load image for editing. Please check the image URL and try again.');
                onClose();
                setIsLoading(false);
                return;
            }
            
            if (!img || !img.width || !img.height) {
                console.error('Invalid image loaded:', img);
                alert('Invalid image. Please verify the image exists and is accessible.');
                onClose();
                setIsLoading(false);
                return;
            }
            
            const scale = Math.min(
                800 / img.width,
                600 / img.height,
                1
            );
            
            console.log('Image loaded successfully:', img.width, 'x', img.height, 'scale:', scale);
            
            img.scale(scale);
            canvas.setDimensions({
                width: img.width * scale,
                height: img.height * scale
            });
            
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                scaleX: scale,
                scaleY: scale
            });
            
            setIsLoading(false);
        }, loadOptions);

        // Enable drawing mode
        canvas.isDrawingMode = false;
        console.log('=== initializeFabric completed ===');
        } catch (error) {
            console.error('Error initializing fabric canvas:', error);
            alert('Error initializing canvas: ' + error.message);
            onClose();
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!fabricCanvasRef.current) return;
        
        const canvas = fabricCanvasRef.current;
        
        if (tool === "draw") {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.color = drawColor;
            canvas.freeDrawingBrush.width = brushWidth;
        } else if (tool === "erase") {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.color = '#FFFFFF'; // White eraser
            canvas.freeDrawingBrush.width = brushWidth;
        } else {
            canvas.isDrawingMode = false;
        }
    }, [tool, drawColor, brushWidth]);

    const applyColorReplacement = () => {
        if (!fabricCanvasRef.current) {
            alert('Canvas not initialized');
            return;
        }
        
        setIsProcessing(true);
        
        try {
            const canvas = fabricCanvasRef.current;
            const dataURL = canvas.toDataURL({ format: 'png' });
            
            const img = new Image();
            img.onload = () => {
                try {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    const data = imageData.data;
                    
                    const bgColor = hexToRgb(backgroundColor);
                    const lineCol = hexToRgb(lineColor);
                    
                    console.log('Applying colors - Background:', bgColor, 'Line:', lineCol);
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        // Detect white/light pixels (background)
                        if (r > 200 && g > 200 && b > 200) {
                            data[i] = bgColor.r;
                            data[i + 1] = bgColor.g;
                            data[i + 2] = bgColor.b;
                        }
                        // Detect black/dark pixels (lines and pattern)
                        else if (r < 80 && g < 80 && b < 80) {
                            data[i] = lineCol.r;
                            data[i + 1] = lineCol.g;
                            data[i + 2] = lineCol.b;
                        }
                    }
                    
                    // Apply brightness
                    if (brightness !== 0) {
                        for (let i = 0; i < data.length; i += 4) {
                            data[i] = Math.min(255, Math.max(0, data[i] + brightness));
                            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
                            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
                        }
                    }
                    
                    // Apply contrast
                    if (contrast !== 0) {
                        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                        for (let i = 0; i < data.length; i += 4) {
                            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
                        }
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Add border if needed
                    if (borderMm > 0) {
                        const pxPerMm = 3.78;
                        const borderPx = Math.round(borderMm * pxPerMm);
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = borderPx * 2;
                        ctx.strokeRect(borderPx, borderPx, tempCanvas.width - borderPx * 2, tempCanvas.height - borderPx * 2);
                    }
                    
                    // Load back to fabric canvas
                    fabric.Image.fromURL(tempCanvas.toDataURL(), (newImg) => {
                        canvas.setBackgroundImage(newImg, canvas.renderAll.bind(canvas), {
                            scaleX: canvas.width / newImg.width,
                            scaleY: canvas.height / newImg.height
                        });
                        setIsProcessing(false);
                        console.log('Colors applied successfully');
                    });
                } catch (error) {
                    console.error('Error applying colors:', error);
                    alert('Error applying colors: ' + error.message);
                    setIsProcessing(false);
                }
            };
            
            img.onerror = () => {
                console.error('Failed to load canvas image for color replacement');
                alert('Failed to load image for color replacement');
                setIsProcessing(false);
            };
            
            img.src = dataURL;
        } catch (error) {
            console.error('Error in color replacement:', error);
            alert('Error in color replacement: ' + error.message);
            setIsProcessing(false);
        }
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    };

    const addText = () => {
        if (!fabricCanvasRef.current) return;
        const text = new fabric.IText('Edit me', {
            left: 100,
            top: 100,
            fontSize: 30,
            fill: drawColor
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const addRectangle = () => {
        if (!fabricCanvasRef.current) return;
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            fill: 'transparent',
            stroke: drawColor,
            strokeWidth: 2
        });
        fabricCanvasRef.current.add(rect);
    };

    const addCircle = () => {
        if (!fabricCanvasRef.current) return;
        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: 'transparent',
            stroke: drawColor,
            strokeWidth: 2
        });
        fabricCanvasRef.current.add(circle);
    };

    const deleteSelected = () => {
        if (!fabricCanvasRef.current) return;
        const activeObjects = fabricCanvasRef.current.getActiveObjects();
        if (activeObjects.length) {
            activeObjects.forEach((obj) => {
                fabricCanvasRef.current.remove(obj);
            });
            fabricCanvasRef.current.discardActiveObject();
            fabricCanvasRef.current.renderAll();
        }
    };

    const resetCanvas = () => {
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
        }
        setTool("select");
        setDrawColor("#000000");
        setBrushWidth(2);
        setBackgroundColor("#FFFFFF");
        setLineColor("#000000");
        setBorderMm(0);
        setBrightness(0);
        setContrast(0);
        initializeFabric();
    };

    const downloadImage = () => {
        if (!fabricCanvasRef.current) {
            alert('Canvas not ready');
            return;
        }
        
        setIsProcessing(true);
        try {
            console.log('Exporting canvas to image...');
            const dataURL = fabricCanvasRef.current.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1
            });
            
            console.log('Canvas exported, converting to blob...');
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    console.log('Blob created, size:', blob.size);
                    const url = URL.createObjectURL(blob);
                    if (onSave) {
                        console.log('Calling onSave callback');
                        onSave(url, blob);
                    }
                })
                .catch(err => {
                    console.error("Error converting to blob:", err);
                    alert("Error saving image: " + err.message);
                })
                .finally(() => {
                    setIsProcessing(false);
                });
        } catch (error) {
            console.error("Error exporting canvas:", error);
            alert("Error saving image: " + error.message);
            setIsProcessing(false);
        }
    };

    const closeEditor = () => {
        try {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        } catch (error) {
            console.error('Error disposing canvas:', error);
        }
        onClose();
    };

    // Always render both button and modal, toggle with CSS
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    closeEditor();
                }
            }}
        >
            <div className="bg-[#171616] rounded-2xl max-w-6xl w-full my-4 relative">
                {/* Header with close button */}
                <div className="p-4 sm:p-6 border-b border-[#2F2E2E]">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl sm:text-2xl text-white font-semibold">Canvas Image Editor</h3>
                        <button 
                            onClick={closeEditor} 
                            className="text-[#808080] hover:text-white text-2xl font-bold leading-none px-2"
                            title="Close Editor"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                        {/* Canvas */}
                        <div className="lg:col-span-3">
                            <div className="bg-[#ffffff] rounded-lg p-4 border-2 border-[#616161] overflow-auto max-h-[500px] relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1] mx-auto mb-2"></div>
                                            <p className="text-sm text-gray-600">Loading image...</p>
                                        </div>
                                    </div>
                                )}
                                <canvas ref={canvasRef} />
                            </div>
                        </div>

                        {/* Tools Panel */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {/* Tools */}
                            <div className="bg-[#1a1817] rounded-lg p-3">
                                <h4 className="text-white text-sm font-semibold mb-2">Tools</h4>
                                <div className="space-y-1 text-xs">
                                    {[
                                        { id: "select", name: "👆 Select/Move" },
                                        { id: "draw", name: "✏️ Draw" },
                                        { id: "erase", name: "🧹 Erase" },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTool(t.id)}
                                            className={`w-full text-left px-2 py-1.5 rounded font-medium transition ${
                                                tool === t.id ? "bg-[#6366f1] text-white" : "bg-[#2F2E2E] text-[#D6D6D6] hover:bg-[#3F3E3E]"
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add Objects */}
                            <div className="bg-[#1a1817] rounded-lg p-3">
                                <h4 className="text-white text-sm font-semibold mb-2">Add</h4>
                                <div className="space-y-1 text-xs">
                                    <button onClick={addText} className="w-full bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-2 py-1.5 rounded">
                                        📝 Text
                                    </button>
                                    <button onClick={addRectangle} className="w-full bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-2 py-1.5 rounded">
                                        ▭ Rectangle
                                    </button>
                                    <button onClick={addCircle} className="w-full bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-2 py-1.5 rounded">
                                        ⭕ Circle
                                    </button>
                                    <button onClick={deleteSelected} className="w-full bg-red-900 hover:bg-red-800 text-white px-2 py-1.5 rounded">
                                        🗑️ Delete Selected
                                    </button>
                                </div>
                            </div>

                            {/* Drawing Settings */}
                            <div className="bg-[#1a1817] rounded-lg p-3">
                                <h4 className="text-white text-sm font-semibold mb-2">Drawing</h4>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="text-[#808080] block mb-1">Color:</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="color"
                                                value={drawColor}
                                                onChange={(e) => setDrawColor(e.target.value)}
                                                className="w-8 h-7 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={drawColor}
                                                onChange={(e) => setDrawColor(e.target.value)}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#808080] block mb-1">Width: {brushWidth}px</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={brushWidth}
                                            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="bg-[#1a1817] rounded-lg p-3">
                                <h4 className="text-white text-sm font-semibold mb-2">Replace Colors</h4>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="text-[#808080] block mb-1">Background:</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="w-8 h-7 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#808080] block mb-1">Lines:</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="color"
                                                value={lineColor}
                                                onChange={(e) => setLineColor(e.target.value)}
                                                className="w-8 h-7 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={lineColor}
                                                onChange={(e) => setLineColor(e.target.value)}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={applyColorReplacement}
                                        disabled={isProcessing}
                                        className="w-full bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1.5 rounded mt-2"
                                    >
                                        {isProcessing ? "Applying..." : "Apply Colors"}
                                    </button>
                                </div>
                            </div>

                            {/* Adjustments */}
                            <div className="bg-[#1a1817] rounded-lg p-3">
                                <h4 className="text-white text-sm font-semibold mb-2">Adjustments</h4>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="text-[#808080] block mb-1">Border: {borderMm}mm</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={borderMm}
                                            onChange={(e) => setBorderMm(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#808080] block mb-1">Brightness: {brightness}</label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={brightness}
                                            onChange={(e) => setBrightness(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#808080] block mb-1">Contrast: {contrast}</label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={contrast}
                                            onChange={(e) => setContrast(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button onClick={resetCanvas} className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-2 rounded-lg text-sm font-medium">
                            🔄 Reset
                        </button>
                        <button onClick={downloadImage} disabled={isProcessing} className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {isProcessing ? "Processing..." : "✅ Save & Download"}
                        </button>
                        <button onClick={closeEditor} className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-2 rounded-lg text-sm font-medium">
                            ✕ Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
