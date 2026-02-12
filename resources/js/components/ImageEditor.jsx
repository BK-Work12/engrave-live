import React, { useRef, useState, useEffect } from "react";

export default function ImageEditor({ imageUrl, onSave }) {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
    const [lineColor, setLineColor] = useState("#000000");
    const [borderMm, setBorderMm] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const applyEdits = async () => {
        if (!canvasRef.current) return;

        setIsProcessing(true);
        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Parse colors
            const bgColor = hexToRgb(backgroundColor);
            const lineCol = hexToRgb(lineColor);

            // Replace white pixels with background color and black pixels with line color
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is white (background)
                if (r > 240 && g > 240 && b > 240) {
                    data[i] = bgColor.r;
                    data[i + 1] = bgColor.g;
                    data[i + 2] = bgColor.b;
                } 
                // Check if pixel is black or dark (lines/pattern)
                else if (r < 50 && g < 50 && b < 50) {
                    data[i] = lineCol.r;
                    data[i + 1] = lineCol.g;
                    data[i + 2] = lineCol.b;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Add border if specified
            if (borderMm > 0) {
                const pxPerMm = 3.78; // 96 DPI / 25.4 mm per inch
                const borderPx = Math.round(borderMm * pxPerMm);
                
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = borderPx * 2;
                ctx.strokeRect(
                    borderPx,
                    borderPx,
                    canvas.width - borderPx * 2,
                    canvas.height - borderPx * 2
                );
            }

            // Convert canvas to blob and pass back
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

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
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
                Edit Colors & Border
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#171616] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl text-white font-semibold mb-6">Edit Image Colors & Border</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Canvas Preview */}
                    <div className="flex flex-col items-center">
                        <label className="text-white text-sm font-medium mb-3 block w-full">Preview:</label>
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-64 border border-[#616161] rounded-xl"
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        {/* Background Color */}
                        <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                                Background Color
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border-2 border-[#616161]"
                                />
                                <input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="flex-1 bg-[#2F2E2E] text-white px-3 py-2 rounded border border-[#616161] text-sm"
                                    placeholder="#FFFFFF"
                                />
                            </div>
                        </div>

                        {/* Line Color */}
                        <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                                Line & Pattern Color
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={lineColor}
                                    onChange={(e) => setLineColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border-2 border-[#616161]"
                                />
                                <input
                                    type="text"
                                    value={lineColor}
                                    onChange={(e) => setLineColor(e.target.value)}
                                    className="flex-1 bg-[#2F2E2E] text-white px-3 py-2 rounded border border-[#616161] text-sm"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        {/* Border */}
                        <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                                Add Border (mm)
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={borderMm}
                                    onChange={(e) => setBorderMm(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-[#2F2E2E] rounded appearance-none cursor-pointer"
                                />
                                <div className="flex items-center gap-1 bg-[#2F2E2E] px-3 py-2 rounded border border-[#616161] min-w-16">
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={borderMm}
                                        onChange={(e) => setBorderMm(parseFloat(e.target.value) || 0)}
                                        className="bg-[#2F2E2E] text-white w-12 text-sm outline-none"
                                    />
                                    <span className="text-[#808080] text-xs">mm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
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
    );
}
