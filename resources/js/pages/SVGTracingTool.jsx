import React, { useRef, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import PrimaryButton from "../components/PrimaryButton";

export default function SVGTracingTool() {
    const fileInputRef = useRef(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [tracedSvg, setTracedSvg] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingExternalImage, setIsLoadingExternalImage] = useState(false);
    
    // Pre-processing settings
    const [threshold, setThreshold] = useState(128);
    const [contrast, setContrast] = useState(0);
    const [invertColors, setInvertColors] = useState(false);
    
    // Tracing options
    const [despeckleLevel, setDespeckleLevel] = useState(2);

    const API_BASE = '/api';

    // Load external image from URL query parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        const backendParam = urlParams.get('backend') || API_BASE;

        if (imageParam) {
            setIsLoadingExternalImage(true);
            // Fetch image from backend
            const imageUrl = `${backendParam}/download/${imageParam}`;
            
            fetch(imageUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load image: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // Create a File object from the blob
                    const file = new File([blob], imageParam, { type: blob.type });
                    setOriginalFile(file);
                    
                    // Create data URL for display
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = (e) => {
                        setOriginalImage(e.target.result);
                    };
                    
                    // Clear URL params without page reload
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(error => {
                    console.error('Error loading external image:', error);
                    alert(`Failed to load image: ${error.message}`);
                })
                .finally(() => {
                    setIsLoadingExternalImage(false);
                });
        }
    }, []);

    const handleFileUpload = (file) => {
        if (!file) return;
        setOriginalFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            setOriginalImage(e.target.result);
        };
        setTracedSvg(null); // Clear previous result
    };

    const handleReplaceOutline = () => {
        setOriginalImage(null);
        setOriginalFile(null);
        setTracedSvg(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTrace = async () => {
        if (!originalFile) {
            alert("Please upload an image first");
            return;
        }

        setIsProcessing(true);
        try {
            // Convert image to base64 for API
            const reader = new FileReader();
            reader.readAsDataURL(originalFile);
            reader.onload = async (e) => {
                const base64Data = e.target.result.split(',')[1]; // Remove data:image/... prefix
                
                const response = await fetch(`${API_BASE}/generate-outline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_base64: base64Data,
                        detail_level: 'high',
                        thickness: 1.5,
                        resolution: 'standard',
                        output_format: 'svg'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.detail || 'Failed to generate outline');
                }

                const data = await response.json();
                if (data.outline_base64) {
                    const svgDataUrl = `data:image/svg+xml;base64,${data.outline_base64}`;
                    setTracedSvg(svgDataUrl);
                } else {
                    throw new Error('No SVG data received');
                }
            };
        } catch (error) {
            console.error("Tracing error:", error);
            alert(`An error occurred during tracing: ${error.message}. Please try again.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadSVG = () => {
        if (!tracedSvg) return;
        
        const link = document.createElement('a');
        link.href = tracedSvg;
        link.download = `traced_${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="container flex flex-col justify-center items-center mx-auto mt-12 mb-15 px-4">
                <div className="w-full max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">SVG Tracing Tool</h1>
                        <p className="text-[#808080]">Convert raster images (PNG/JPG) to clean SVG outlines</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Original Image */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg text-white font-semibold">ORIGINAL + OUTLINE</h3>
                                    {originalImage && (
                                        <button
                                            onClick={handleReplaceOutline}
                                            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                                        >
                                            Replace Outline
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                                />
                                {isLoadingExternalImage ? (
                                    <div className="border border-dashed border-[#616161] rounded-xl p-12 text-center bg-[#2F2E2E]">
                                        <p className="text-sm text-[#808080]">Loading image...</p>
                                    </div>
                                ) : originalImage ? (
                                    <div className="relative bg-white rounded-xl overflow-hidden p-4 flex items-center justify-center min-h-[300px]">
                                        <img 
                                            src={originalImage} 
                                            alt="Original" 
                                            className="max-w-full max-h-full w-auto h-auto object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border border-dashed border-[#616161] rounded-xl p-12 text-center cursor-pointer hover:border-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[#616161]">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <p className="text-sm text-[#808080] mt-4">Upload an Image</p>
                                        <p className="text-xs text-[#808080] mt-2">Drag and drop an image here, or click to select a PNG or JPG file</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Center: Traced SVG */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-6">
                                <h3 className="text-lg text-white font-semibold mb-4">TRACED VECTOR (SVG)</h3>
                                {tracedSvg ? (
                                    <div className="relative bg-white rounded-xl overflow-hidden p-4 flex items-center justify-center min-h-[300px]">
                                        <img 
                                            src={tracedSvg} 
                                            alt="Traced SVG" 
                                            className="max-w-full max-h-full w-auto h-auto object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-[#616161] rounded-xl p-12 text-center bg-[#2F2E2E]">
                                        <p className="text-sm text-[#808080]">Your traced SVG will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Settings Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-6">
                                <h3 className="text-lg text-white font-semibold mb-4">Settings</h3>
                                
                                {/* Image Pre-processing */}
                                <div className="mb-6">
                                    <h4 className="text-sm text-white font-semibold mb-3">IMAGE PRE-PROCESSING</h4>
                                    
                                    {/* Threshold */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm text-[#808080] flex items-center gap-2">
                                                Threshold
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#616161] cursor-help">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setThreshold(Math.max(0, threshold - 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-mono text-sm w-12 text-center">{threshold}</span>
                                                <button
                                                    onClick={() => setThreshold(Math.min(255, threshold + 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={threshold}
                                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                                        />
                                    </div>

                                    {/* Contrast */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm text-[#808080] flex items-center gap-2">
                                                Contrast
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#616161] cursor-help">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setContrast(Math.max(-100, contrast - 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-mono text-sm w-12 text-center">{contrast}</span>
                                                <button
                                                    onClick={() => setContrast(Math.min(100, contrast + 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={contrast}
                                            onChange={(e) => setContrast(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                                        />
                                    </div>

                                    {/* Invert Colors */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-[#808080]">Invert Colors</label>
                                        <button
                                            onClick={() => setInvertColors(!invertColors)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                                invertColors ? 'bg-[#6366f1]' : 'bg-[#2F2E2E]'
                                            }`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                invertColors ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tracing Options */}
                                <div className="mb-6">
                                    <h4 className="text-sm text-white font-semibold mb-3">TRACING OPTIONS</h4>
                                    
                                    {/* Despeckle Level */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm text-[#808080] flex items-center gap-2">
                                                Despeckle Level
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#616161] cursor-help">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setDespeckleLevel(Math.max(0, despeckleLevel - 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                                <span className="text-white font-mono text-sm w-12 text-center">{despeckleLevel}</span>
                                                <button
                                                    onClick={() => setDespeckleLevel(Math.min(10, despeckleLevel + 1))}
                                                    className="text-[#808080] hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={despeckleLevel}
                                            onChange={(e) => setDespeckleLevel(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#2F2E2E] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <PrimaryButton
                                        text={isProcessing ? "Tracing..." : "Trace Image"}
                                        onClick={handleTrace}
                                        disabled={!originalImage || isProcessing}
                                        className="w-full"
                                    />
                                    {tracedSvg && (
                                        <PrimaryButton
                                            text="Download SVG"
                                            onClick={handleDownloadSVG}
                                            className="w-full bg-[#6366f1] hover:bg-[#4f46e5]"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
