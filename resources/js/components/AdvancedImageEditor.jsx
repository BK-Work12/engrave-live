import React, { useRef, useState, useEffect } from "react";

export default function AdvancedImageEditor({ imageUrl, onSave }) {
    const canvasRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tool, setTool] = useState("pen"); // pen, eraser, fill, colorPicker, brush
    const [penColor, setPenColor] = useState("#000000");
    const [penSize, setPenSize] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Color adjustments
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    
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
        };
        img.src = imageUrl;
    };

    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const applyColorAdjustments = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
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
            applyColorAdjustments();

            canvasRef.current.toBlob((blob) => {
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
        loadImageToCanvas();
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
                Advanced Editor
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#171616] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-2xl text-white font-semibold mb-6">Advanced Image Editor</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Canvas */}
                        <div className="lg:col-span-2">
                            <label className="text-white text-sm font-medium mb-2 block">Canvas:</label>
                            <div className="bg-white rounded-lg overflow-auto max-h-96 border border-[#616161]">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    className="cursor-crosshair"
                                />
                            </div>
                        </div>

                        {/* Tools Panel */}
                        <div className="space-y-6 bg-[#1a1817] rounded-lg p-4">
                            {/* Drawing Tools */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-3">Drawing Tools</h4>
                                <div className="space-y-2">
                                    {[
                                        { id: "pen", name: "✏️ Pen", icon: "pen" },
                                        { id: "brush", name: "🖌️ Brush", icon: "brush" },
                                        { id: "eraser", name: "🧹 Eraser", icon: "eraser" },
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

                            {/* Pen Properties */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-3">Properties</h4>
                                <div className="space-y-3">
                                    {tool !== "eraser" && (
                                        <div>
                                            <label className="text-[#808080] text-xs block mb-2">Color:</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={penColor}
                                                    onChange={(e) => setPenColor(e.target.value)}
                                                    className="w-12 h-8 rounded cursor-pointer border-2 border-[#616161]"
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
                                        <label className="text-[#808080] text-xs block mb-2">
                                            Size: <span className="text-white">{penSize}px</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={penSize}
                                            onChange={(e) => setPenSize(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Adjustments */}
                            <div>
                                <h4 className="text-white text-sm font-semibold mb-3">Adjustments</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[#808080] text-xs block mb-1">
                                            Brightness: <span className="text-white">{brightness}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={brightness}
                                            onChange={(e) => setBrightness(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[#808080] text-xs block mb-1">
                                            Contrast: <span className="text-white">{contrast}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={contrast}
                                            onChange={(e) => setContrast(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={resetImage}
                            className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            Reset
                        </button>
                        <button
                            onClick={applyEdits}
                            disabled={isProcessing}
                            className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            {isProcessing ? "Processing..." : "Apply & Download"}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isProcessing}
                            className="flex-1 bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
