import React, { useRef, useState, useEffect } from "react";

export default function UnifiedImageEditor({ imageUrl, onSave }) {
    const canvasRef = useRef(null);
    const previewRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tool, setTool] = useState("pen");
    const [penColor, setPenColor] = useState("#000000");
    const [penSize, setPenSize] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Color replacements
    const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
    const [lineColor, setLineColor] = useState("#000000");
    const [borderMm, setBorderMm] = useState(0);
    
    // Adjustments
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [previewMode, setPreviewMode] = useState("editor"); // editor or preview

    useEffect(() => {
        if (imageUrl && isEditing) {
            loadImageToCanvas();
        }
    }, [imageUrl, isEditing]);

    const loadImageToCanvas = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            updatePreview();
        };
        img.src = imageUrl;
    };

    const startDrawing = (e) => {
        if (!canvasRef.current || tool === "fill") return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

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
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        const ctx = canvas.getContext("2d");
        
        if (tool === "eraser") {
            ctx.clearRect(x - penSize / 2, y - penSize / 2, penSize, penSize);
        } else if (tool === "pen" || tool === "brush") {
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        updatePreview();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const updatePreview = () => {
        if (!canvasRef.current || !previewRef.current) return;
        
        const sourceCanvas = canvasRef.current;
        const previewCanvas = previewRef.current;
        
        previewCanvas.width = sourceCanvas.width;
        previewCanvas.height = sourceCanvas.height;
        
        const sourceCtx = sourceCanvas.getContext("2d");
        const previewCtx = previewCanvas.getContext("2d");
        
        // Get current image data
        const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = new Uint8ClampedArray(imageData.data);
        
        // Apply color replacements
        applyColorReplacements(data);
        
        // Apply adjustments
        applyAdjustments(data);
        
        // Write to preview
        const newImageData = new ImageData(data, sourceCanvas.width, sourceCanvas.height);
        previewCtx.putImageData(newImageData, 0, 0);
        
        // Add border if needed
        if (borderMm > 0) {
            const pxPerMm = 3.78;
            const borderPx = Math.round(borderMm * pxPerMm);
            previewCtx.strokeStyle = lineColor;
            previewCtx.lineWidth = borderPx * 2;
            previewCtx.strokeRect(borderPx, borderPx, previewCanvas.width - borderPx * 2, previewCanvas.height - borderPx * 2);
        }
    };

    const applyColorReplacements = (data) => {
        const bgColor = hexToRgb(backgroundColor);
        const lineCol = hexToRgb(lineColor);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // More lenient white detection (> 200 for each channel)
            if (r > 200 && g > 200 && b > 200) {
                data[i] = bgColor.r;
                data[i + 1] = bgColor.g;
                data[i + 2] = bgColor.b;
            }
            // More lenient black detection (< 50 for each channel)
            else if (r < 50 && g < 50 && b < 50) {
                data[i] = lineCol.r;
                data[i + 1] = lineCol.g;
                data[i + 2] = lineCol.b;
            }
        }
    };

    const applyAdjustments = (data) => {
        if (brightness === 0 && contrast === 0) return;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (brightness !== 0) {
                r = Math.min(255, Math.max(0, r + brightness));
                g = Math.min(255, Math.max(0, g + brightness));
                b = Math.min(255, Math.max(0, b + brightness));
            }

            if (contrast !== 0) {
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
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

    const resetImage = () => {
        setTool("pen");
        setPenColor("#000000");
        setPenSize(2);
        setBackgroundColor("#FFFFFF");
        setLineColor("#000000");
        setBorderMm(0);
        setBrightness(0);
        setContrast(0);
        setPreviewMode("editor");
        loadImageToCanvas();
    };

    const applyEdits = async () => {
        if (!previewRef.current) return;

        setIsProcessing(true);
        try {
            previewRef.current.toBlob((blob) => {
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
                Full Editor
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-[#171616] rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h3 className="text-xl sm:text-2xl text-white font-semibold">Complete Image Editor</h3>
                        <button onClick={() => setIsEditing(false)} className="text-[#808080] hover:text-white text-xl">✕</button>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-4 bg-[#1a1817] p-2 rounded-lg">
                        <button
                            onClick={() => setPreviewMode("editor")}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                previewMode === "editor"
                                    ? "bg-[#6366f1] text-white"
                                    : "bg-[#2F2E2E] text-[#D6D6D6] hover:bg-[#3F3E3E]"
                            }`}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onClick={() => { setPreviewMode("preview"); updatePreview(); }}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                previewMode === "preview"
                                    ? "bg-[#6366f1] text-white"
                                    : "bg-[#2F2E2E] text-[#D6D6D6] hover:bg-[#3F3E3E]"
                            }`}
                        >
                            👁️ Preview
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        {/* Canvas Views */}
                        <div className="lg:col-span-2">
                            {previewMode === "editor" ? (
                                <div>
                                    <label className="text-white text-sm font-medium mb-2 block">Drawing Canvas:</label>
                                    <div className="bg-[#1a1817] rounded-lg overflow-auto max-h-96 border-2 border-[#616161]">
                                        <canvas
                                            ref={canvasRef}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            className="cursor-crosshair w-full"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-white text-sm font-medium mb-2 block">Preview (with all edits):</label>
                                    <div className="bg-white rounded-lg overflow-auto max-h-96 border-2 border-[#616161] flex items-center justify-center">
                                        <canvas
                                            ref={previewRef}
                                            className="max-w-full max-h-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Control Panel */}
                        <div className="space-y-4 sm:space-y-6 bg-[#1a1817] rounded-lg p-4">
                            {/* Drawing Tools */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-2">Tools</h4>
                                <div className="space-y-1">
                                    {[
                                        { id: "pen", name: "✏️ Pen" },
                                        { id: "brush", name: "🖌️ Brush" },
                                        { id: "eraser", name: "🧹 Eraser" },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTool(t.id)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                                                tool === t.id
                                                    ? "bg-[#6366f1] text-white"
                                                    : "bg-[#2F2E2E] text-[#D6D6D6] hover:bg-[#3F3E3E]"
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pen Settings */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-2">Pen</h4>
                                {tool !== "eraser" && (
                                    <div className="mb-3">
                                        <label className="text-[#808080] text-xs block mb-2">Color:</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={penColor}
                                                onChange={(e) => setPenColor(e.target.value)}
                                                className="w-10 h-8 rounded cursor-pointer border-2 border-[#616161]"
                                            />
                                            <input
                                                type="text"
                                                value={penColor}
                                                onChange={(e) => setPenColor(e.target.value)}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded border border-[#616161] text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[#808080] text-xs block mb-1">
                                        Size: <span className="text-white">{penSize}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={penSize}
                                        onChange={(e) => setPenSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-2">Colors</h4>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="text-[#808080] block mb-1">Background:</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => { setBackgroundColor(e.target.value); updatePreview(); }}
                                                className="w-10 h-8 rounded cursor-pointer border-2 border-[#616161]"
                                            />
                                            <input
                                                type="text"
                                                value={backgroundColor}
                                                onChange={(e) => { setBackgroundColor(e.target.value); updatePreview(); }}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded border border-[#616161]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#808080] block mb-1">Lines/Pattern:</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={lineColor}
                                                onChange={(e) => { setLineColor(e.target.value); updatePreview(); }}
                                                className="w-10 h-8 rounded cursor-pointer border-2 border-[#616161]"
                                            />
                                            <input
                                                type="text"
                                                value={lineColor}
                                                onChange={(e) => { setLineColor(e.target.value); updatePreview(); }}
                                                className="flex-1 bg-[#2F2E2E] text-white px-2 py-1 rounded border border-[#616161]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Border & Adjustments */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-2">Adjustments</h4>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="text-[#808080] block mb-1">Border (mm): {borderMm}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={borderMm}
                                            onChange={(e) => { setBorderMm(parseFloat(e.target.value)); updatePreview(); }}
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
                                            onChange={(e) => { setBrightness(parseInt(e.target.value)); updatePreview(); }}
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
                                            onChange={(e) => { setContrast(parseInt(e.target.value)); updatePreview(); }}
                                            className="w-full h-2 bg-[#2F2E2E] rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={resetImage}
                            className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-2 sm:py-3 rounded-lg text-sm font-medium"
                        >
                            🔄 Reset
                        </button>
                        <button
                            onClick={() => { setPreviewMode("preview"); updatePreview(); }}
                            className="flex-1 bg-[#4F4E4E] hover:bg-[#5F5E5E] text-white px-4 py-2 sm:py-3 rounded-lg text-sm font-medium"
                        >
                            👁️ Update Preview
                        </button>
                        <button
                            onClick={applyEdits}
                            disabled={isProcessing}
                            className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 sm:py-3 rounded-lg text-sm font-medium"
                        >
                            {isProcessing ? "Processing..." : "✅ Download"}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isProcessing}
                            className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 sm:py-3 rounded-lg text-sm font-medium"
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
