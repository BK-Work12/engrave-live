import React, { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ComparisonViewer } from '../components/ComparisonViewer';
import { OutlineButton } from '../components/OutlineButton';
import { resizeImage } from '../utils/imageUtils';
import { adjustSvgStrokeWidth, svgToDataUrl } from '../utils/svgUtils';
import { generateOutline } from '../services/geminiService';

// App States
const AppState = {
    IDLE: 'idle',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error'
};

export default function OutlineGenerator() {
    const [appState, setAppState] = useState(AppState.IDLE);
    const [imageData, setImageData] = useState({
        original: '',
        outline: null,
        originalFile: null,
        isSvg: false
    });
    const [error, setError] = useState(null);
    const [externalImageLoading, setExternalImageLoading] = useState(false);

    // Configuration State
    const [config, setConfig] = useState({
        detailLevel: 'medium',
        thickness: 1.5,
        resolution: 'standard',
        outputFormat: 'png',
        svgStrokeWidth: 0.28
    });

    // Check for image from URL params on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        const externalImage = urlParams.get('external_image');
        const backend = urlParams.get('backend') || '/api';

        // Priority 1: Direct base64 image data
        if (imageParam) {
            try {
                const decodedData = decodeURIComponent(imageParam);
                // Check if it already has data URL prefix, if not add it
                const imageDataUrl = decodedData.startsWith('data:')
                    ? decodedData
                    : `data:image/png;base64,${decodedData}`;

                setImageData({
                    original: imageDataUrl,
                    outline: null,
                    originalFile: null,
                    isSvg: false
                });
                // Clear the URL params without page reload
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error('Error loading base64 image:', err);
                setError('Failed to load image from URL');
            }
        }
        // Priority 2: External image from backend
        else if (externalImage) {
            setExternalImageLoading(true);
            // Fetch the image as base64 from the Laravel backend
            fetch(`${backend}/image-base64/${externalImage}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.dataUrl) {
                        setImageData({
                            original: data.dataUrl,
                            outline: null,
                            originalFile: null,
                            isSvg: false
                        });
                        // Clear the URL params without page reload
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        setError('Failed to load external image');
                    }
                })
                .catch(err => {
                    console.error('Error loading external image:', err);
                    setError('Failed to load external image from backend');
                })
                .finally(() => {
                    setExternalImageLoading(false);
                });
        }
    }, []);

    const handleFileSelect = async (file) => {
        try {
            setAppState(AppState.IDLE);
            setError(null);

            const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

            if (isSvg) {
                // Read SVG as text
                const svgText = await file.text();
                const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;

                setImageData({
                    original: svgDataUrl,
                    outline: null,
                    originalFile: file,
                    isSvg: true
                });
            } else {
                // Resize immediately for display and processing performance
                const resizedBase64 = await resizeImage(file, 1024);

                setImageData({
                    original: resizedBase64,
                    outline: null,
                    originalFile: file,
                    isSvg: false
                });
            }
        } catch (err) {
            setError("Failed to process image. Please try another one.");
            console.error(err);
        }
    };

    const handleGenerate = async () => {
        if (!imageData.original) return;

        setAppState(AppState.PROCESSING);
        setError(null);

        try {
            if (imageData.isSvg && imageData.originalFile) {
                // For SVG files, adjust stroke width
                const svgText = await imageData.originalFile.text();
                const adjustedSvg = adjustSvgStrokeWidth(svgText, config.svgStrokeWidth || 1);
                const adjustedDataUrl = svgToDataUrl(adjustedSvg);

                setImageData(prev => ({ ...prev, outline: adjustedDataUrl }));
                setAppState(AppState.COMPLETE);
            } else {
                // For raster images, use AI to generate outline
                const outlineBase64 = await generateOutline(imageData.original, config);
                setImageData(prev => ({ ...prev, outline: outlineBase64 }));
                setAppState(AppState.COMPLETE);
            }
        } catch (err) {
            setAppState(AppState.ERROR);
            setError(imageData.isSvg
                ? "Failed to adjust SVG outline. Please try again."
                : "Failed to generate outline. The AI might be busy or the image content is restricted. Please try again.");
        }
    };

    const handleReset = () => {
        setImageData({ original: '', outline: null, originalFile: null, isSvg: false });
        setAppState(AppState.IDLE);
        setError(null);
    };

    const handleDownload = () => {
        if (!imageData.outline) return;
        const link = document.createElement('a');
        link.href = imageData.outline;

        let filename = `outline-${Date.now()}`;
        if (imageData.isSvg) {
            filename += '.svg';
        } else {
            filename += config.outputFormat === 'svg' ? '.svg' : '.png';
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
            {/* Main Content */}
            <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col items-center">

                {/* Loading external image indicator */}
                {externalImageLoading && (
                    <div className="text-center mb-10 max-w-2xl animate-fade-in-up">
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                                <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-indigo-300 font-medium">Loading image from backend...</p>
                        </div>
                    </div>
                )}

                {/* Intro Text (only when IDLE and no image selected) */}
                {!imageData.original && !externalImageLoading && (
                    <div className="text-center mb-10 max-w-2xl animate-fade-in-up">
                        <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
                            Turn photos into <span className="text-indigo-400">clean line art</span>.
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Upload any JPG, PNG, or SVG. Our AI extracts outlines from images, or adjust SVG stroke width for laser cutting fitment.
                            Perfect for coloring pages, technical drawings, or artistic references.
                        </p>
                    </div>
                )}

                {/* Workspace */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Column: Input & Controls */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Upload Area */}
                        {!imageData.original ? (
                            <DropZone onFileSelect={handleFileSelect} />
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-slate-900 border border-slate-700">
                                    <img src={imageData.original} alt="Original" className="w-full h-full object-contain" />
                                    <button
                                        onClick={handleReset}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-colors"
                                        title="Remove Image"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Configuration Controls */}
                                <div className="space-y-4">
                                    {!imageData.isSvg ? (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    DETAIL LEVEL
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['low', 'medium', 'high']).map((level) => (
                                                        <button
                                                            key={level}
                                                            onClick={() => setConfig({ ...config, detailLevel: level })}
                                                            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${config.detailLevel === level
                                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                }`}
                                                        >
                                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                        LINE THICKNESS
                                                    </label>
                                                    <span className="text-xs font-mono bg-indigo-600 text-white px-2 py-1 rounded">
                                                        {config.thickness.toFixed(1)}px
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="10"
                                                    step="0.5"
                                                    value={config.thickness}
                                                    onChange={(e) => setConfig({ ...config, thickness: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                    <span>Thin</span>
                                                    <span>Thick</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    RESOLUTION
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['standard', 'high', 'ultra']).map((res) => (
                                                        <button
                                                            key={res}
                                                            onClick={() => setConfig({ ...config, resolution: res })}
                                                            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${config.resolution === res
                                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                }`}
                                                        >
                                                            {res === 'standard' ? 'Std' : res === 'high' ? 'High' : 'Ultra'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                    OUTPUT FORMAT
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(['png', 'svg']).map((fmt) => (
                                                        <button
                                                            key={fmt}
                                                            onClick={() => setConfig({ ...config, outputFormat: fmt })}
                                                            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${config.outputFormat === fmt
                                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                }`}
                                                        >
                                                            {fmt.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    SVG wraps the outline for easy vector-friendly downloads.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                OUTLINE THICKNESS (PX)
                                            </label>
                                            <div className="space-y-3">
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="5"
                                                    step="0.05"
                                                    value={config.svgStrokeWidth || 0.28}
                                                    onChange={(e) => setConfig({ ...config, svgStrokeWidth: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">0.1px</span>
                                                    <div className="px-3 py-1 bg-indigo-600 text-white text-sm font-mono rounded-md">
                                                        {(config.svgStrokeWidth || 0.28).toFixed(2)}px
                                                    </div>
                                                    <span className="text-xs text-slate-500">5.0px</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Adjust stroke width for better laser fitment
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button */}
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <OutlineButton
                                        className="w-full h-12 text-lg"
                                        onClick={handleGenerate}
                                        isLoading={appState === AppState.PROCESSING}
                                        icon={
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        }
                                    >
                                        {imageData.isSvg
                                            ? (imageData.outline ? 'Update Thickness' : 'Adjust Thickness')
                                            : (imageData.outline ? 'Regenerate' : 'Generate Outline')
                                        }
                                    </OutlineButton>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm animate-pulse">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Result Viewer */}
                    <div className="lg:col-span-2">
                        {!imageData.original ? (
                            <div className="h-64 sm:h-[30rem] border border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center text-slate-600">
                                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Preview will appear here</p>
                            </div>
                        ) : !imageData.outline ? (
                            // Just Original View when processing or before generation
                            <div className="relative aspect-square sm:aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl flex items-center justify-center">
                                <img src={imageData.original} alt="Preview" className="max-w-full max-h-full object-contain" />
                                {appState === AppState.PROCESSING && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                        <div className="relative w-20 h-20">
                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                                            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                                        </div>
                                        <p className="mt-6 text-indigo-300 font-medium animate-pulse">Tracing contours...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Comparison View when complete
                            <div className="space-y-4 animate-fade-in">
                                <ComparisonViewer
                                    originalSrc={imageData.original}
                                    outlineSrc={imageData.outline}
                                />
                                <div className="flex justify-end gap-3 pt-2">
                                    <OutlineButton variant="secondary" onClick={() => setImageData(prev => ({ ...prev, outline: null }))}>
                                        Back to Edit
                                    </OutlineButton>
                                    <OutlineButton variant="primary" onClick={handleDownload} icon={
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    }>
                                        Download Outline
                                    </OutlineButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Simple CSS animation for fade-in effect */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fadeIn 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
