import React, { useRef, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import PrimaryButton from "../components/PrimaryButton";

export default function Generator() {
    const outlineInputRef = useRef(null);
    const patternUploadInputRef = useRef(null);
    const [outlineImage, setOutlineImage] = useState(null);
    const [outlineFile, setOutlineFile] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatedImageFilename, setGeneratedImageFilename] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Pattern selection
    const [patternLibraries, setPatternLibraries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [patterns, setPatterns] = useState([]);
    const [selectedPattern, setSelectedPattern] = useState(null);
    const [selectedPatternFile, setSelectedPatternFile] = useState(null);
    const [isUploadingPattern, setIsUploadingPattern] = useState(false);
    
    // Customization settings
    const [patternIntricacy, setPatternIntricacy] = useState("standard");
    const [patternSymmetry, setPatternSymmetry] = useState("none");
    const [offsetBorder, setOffsetBorder] = useState("disabled");

    const API_BASE = '/api';

    useEffect(() => {
        loadPatternLibraries();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadPatterns(selectedCategory);
        }
    }, [selectedCategory]);

    const loadPatternLibraries = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/pattern-library/list?user_id=default`);
            const data = await response.json();
            if (data.success && data.libraries.length > 0) {
                setPatternLibraries(data.libraries);
                setSelectedCategory(data.libraries[0].category);
            }
        } catch (error) {
            console.error("Error loading libraries:", error);
        }
    };

    const loadPatterns = async (category) => {
        try {
            const response = await fetch(`${API_BASE}/api/pattern-library/list/${category}?user_id=default`);
            const data = await response.json();
            if (data.success) {
                setPatterns(data.patterns);
            }
        } catch (error) {
            console.error("Error loading patterns:", error);
        }
    };

    const handleOutlineUpload = (file) => {
        if (!file) return;
        setOutlineFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            setOutlineImage(e.target.result);
        };
    };

    const handlePatternSelect = async (patternId) => {
        if (!patternId) {
            setSelectedPattern(null);
            setSelectedPatternFile(null);
            return;
        }

        const pattern = patterns.find(p => p.id === patternId);
        if (!pattern) return;

        setSelectedPattern(pattern);
        
        // Fetch pattern image
        try {
            const patternUrl = pattern.url.startsWith('http') ? pattern.url : `${API_BASE}${pattern.url}`;
            const response = await fetch(patternUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch pattern: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Determine file extension from URL or pattern name
            let extension = '.png';
            if (pattern.url.toLowerCase().endsWith('.svg')) {
                extension = '.svg';
            } else if (pattern.url.toLowerCase().endsWith('.jpg') || pattern.url.toLowerCase().endsWith('.jpeg')) {
                extension = '.jpg';
            }
            
            // Create filename with proper extension
            const filename = pattern.name.endsWith(extension) ? pattern.name : `${pattern.name}${extension}`;
            
            // Determine MIME type
            let mimeType = blob.type || 'image/png';
            if (extension === '.svg') {
                mimeType = 'image/svg+xml';
            } else if (extension === '.jpg' || extension === '.jpeg') {
                mimeType = 'image/jpeg';
            }
            
            const file = new File([blob], filename, { type: mimeType });
            setSelectedPatternFile(file);
        } catch (error) {
            console.error("Error loading pattern:", error);
            alert(`Failed to load pattern image: ${error.message}`);
        }
    };

    const handlePatternUpload = async (file) => {
        if (!file) return;
        if (!selectedCategory) {
            alert("Please select a category first");
            return;
        }

        setIsUploadingPattern(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', selectedCategory);
            formData.append('user_id', 'default');

            const response = await fetch(`${API_BASE}/api/pattern-library/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                // Reload patterns for the selected category
                await loadPatterns(selectedCategory);
                // Reload libraries to update counts
                await loadPatternLibraries();
                alert("Pattern uploaded successfully!");
            } else {
                alert(`Upload failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error uploading pattern:", error);
            alert(`Failed to upload pattern: ${error.message}`);
        } finally {
            setIsUploadingPattern(false);
            if (patternUploadInputRef.current) {
                patternUploadInputRef.current.value = '';
            }
        }
    };

    const handleGenerate = async () => {
        if (!outlineFile) {
            alert("Please upload outline image");
            return;
        }

        if (!selectedPatternFile) {
            alert("Please select a pattern");
            return;
        }

        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('outline', outlineFile);
            formData.append('design', selectedPatternFile);
            
            // Add customization options
            formData.append('pattern_intricacy', patternIntricacy);
            formData.append('pattern_symmetry', patternSymmetry);
            formData.append('offset_border', offsetBorder);

            // Use new endpoint with customization support
            const response = await fetch(`${API_BASE}/api/generator/generate`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `Generation failed: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Fallback to default message if JSON parsing fails
                }
                throw new Error(errorMessage);
            }

            // Try to parse as JSON first (new API format)
            let responseData;
            const contentType = response.headers.get('content-type');
            let imageUrl = '';
            let filename = '';

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                if (responseData.success && responseData.image_url) {
                    imageUrl = responseData.image_url;
                    filename = responseData.filename || '';
                } else if (!responseData.success) {
                    throw new Error(responseData.error || 'Generation failed');
                }
            } else {
                // Handle HTML response (legacy format)
                const htmlText = await response.text();

                const imgMatch = htmlText.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch && imgMatch[1]) {
                    imageUrl = imgMatch[1];
                    const urlParts = imageUrl.split('/');
                    filename = urlParts[urlParts.length - 1];
                } else {
                    const resultUrlMatch = htmlText.match(/result_url\s*=\s*["']([^"']+)["']/i);
                    if (resultUrlMatch && resultUrlMatch[1]) {
                        imageUrl = resultUrlMatch[1];
                        const urlParts = imageUrl.split('/');
                        filename = urlParts[urlParts.length - 1];
                    } else {
                        throw new Error('Could not extract image URL from API response');
                    }
                }
            }

            // Make URL absolute
            if (imageUrl.startsWith('/static/')) {
                imageUrl = `/api${imageUrl}`;
            } else if (imageUrl.startsWith('static/')) {
                imageUrl = `/api/download/${imageUrl}`;
            }

            if (imageUrl) {
                setGeneratedImage(imageUrl);
                setGeneratedImageFilename(filename);
            }
        } catch (error) {
            console.error("Generation error:", error);
            alert(`An error occurred during generation: ${error.message}. Please try again.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPNG = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadSVG = () => {
        if (!generatedImageFilename) return;
        const svgFilename = generatedImageFilename.replace('.png', '.svg');
        window.open(`${API_BASE}/static/uploads/${svgFilename}`, '_blank');
    };

    const handleOpenInSVGTool = () => {
        if (generatedImageFilename) {
            // Navigate to SVG tracing tool with image parameter
            window.location.href = `/svg-tracing-tool?image=${generatedImageFilename}&backend=${API_BASE}`;
        }
    };

    return (
        <>
            <div className="container flex flex-col justify-center items-center mx-auto mt-12 mb-15 px-4">
                <div className="w-full max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Upload Outline */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-8 min-h-[600px] flex flex-col">
                                <h3 className="text-xl text-white font-semibold mb-6 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Upload Outline
                                </h3>
                                <input
                                    type="file"
                                    ref={outlineInputRef}
                                    className="hidden"
                                    accept="image/png,image/jpeg,image/svg+xml"
                                    onChange={(e) => handleOutlineUpload(e.target.files?.[0])}
                                />
                                {outlineImage ? (
                                    <div className="relative bg-white rounded-xl overflow-hidden mb-6 flex-1 min-h-[400px] flex items-center justify-center p-4">
                                        <img src={outlineImage} alt="Outline" className="max-w-full max-h-full w-auto h-auto object-contain" />
                                        <button
                                            onClick={() => outlineInputRef.current?.click()}
                                            className="absolute top-4 right-4 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                        >
                                            Replace
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => outlineInputRef.current?.click()}
                                        className="border-2 border-dashed border-[#616161] rounded-xl p-16 text-center cursor-pointer hover:border-white transition-colors mb-6 flex-1 min-h-[400px] flex flex-col items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[#616161] mb-4">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <p className="text-base text-[#808080] mt-4 font-medium">Click or drag to upload</p>
                                        <p className="text-sm text-[#808080] mt-2">PNG, JPG, or SVG. SVG files will be converted to PNG.</p>
                                    </div>
                                )}
                                
                                {/* Tips & Tricks Guide */}
                                <div className="mt-4 bg-[#2F2E2E] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1]">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <polyline points="10 9 9 9 8 9" />
                                        </svg>
                                        <h4 className="text-sm text-white font-semibold">Tips & Tricks Guide v1.1</h4>
                                    </div>
                                    <p className="text-xs text-[#808080] mb-3">Download our comprehensive guide</p>
                                    <button className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm">
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Center: Result */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-8 min-h-[600px] flex flex-col">
                                <h3 className="text-xl text-white font-semibold mb-6 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Result: Engrave-Ready Design
                                </h3>
                                {generatedImage ? (
                                    <div className="relative bg-white rounded-xl overflow-hidden mb-6 flex-1 min-h-[400px] flex items-center justify-center p-4">
                                        <img
                                            src={generatedImage}
                                            alt="Generated Design"
                                            className="max-w-full max-h-full w-auto h-auto object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-[#616161] rounded-xl p-16 text-center bg-[#2F2E2E] mb-6 flex-1 min-h-[400px] flex items-center justify-center">
                                        <p className="text-base text-[#808080] font-medium">Your generated design will appear here</p>
                                    </div>
                                )}
                                
                                {/* Download Options */}
                                {generatedImage && (
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <p className="text-sm text-[#808080] mb-2">Download as:</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDownloadSVG}
                                                    className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    SVG
                                                </button>
                                                <button
                                                    onClick={handleDownloadPNG}
                                                    className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    PNG
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[#808080] mb-2">Open in:</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleOpenInSVGTool}
                                                    className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    SVG Tool
                                                </button>
                                                <button
                                                    onClick={() => window.open(generatedImage, '_blank')}
                                                    className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    Preview Tool
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Customize Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#171616] rounded-[30px] p-8 min-h-[600px] flex flex-col">
                                {/* Pattern Selection */}
                                <div className="mb-6">
                                    <label className="text-lg text-white font-semibold block mb-4">Pattern Selection</label>
                                    {patternLibraries.length > 0 && (
                                        <select
                                            value={selectedCategory || ""}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-4 py-3 mb-4 text-base"
                                        >
                                            {patternLibraries.map((lib) => (
                                                <option key={lib.category} value={lib.category}>
                                                    {lib.name} ({lib.pattern_count || 0})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {/* Upload Pattern Button */}
                                    <div className="mb-4">
                                        <input
                                            type="file"
                                            ref={patternUploadInputRef}
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/svg+xml"
                                            onChange={(e) => handlePatternUpload(e.target.files?.[0])}
                                        />
                                        <button
                                            onClick={() => patternUploadInputRef.current?.click()}
                                            disabled={!selectedCategory || isUploadingPattern}
                                            className="w-full bg-[#2F2E2E] hover:bg-[#3F3E3E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-base font-medium flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            {isUploadingPattern ? "Uploading..." : "Upload Pattern"}
                                        </button>
                                    </div>

                                    {/* Pattern Images Grid */}
                                    {selectedCategory && patterns.length > 0 && (
                                        <div className="mb-4">
                                            <label className="text-sm text-[#808080] block mb-3">Select Pattern:</label>
                                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                                {patterns.map((pattern) => (
                                                    <div
                                                        key={pattern.id}
                                                        onClick={() => handlePatternSelect(pattern.id)}
                                                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                                            selectedPattern?.id === pattern.id
                                                                ? 'border-[#6366f1] ring-2 ring-[#6366f1]'
                                                                : 'border-[#616161] hover:border-[#808080]'
                                                        }`}
                                                    >
                                                        <div className="aspect-square bg-white flex items-center justify-center">
                                                            {pattern.thumbnail ? (
                                                                <img
                                                                    src={pattern.thumbnail.startsWith('http') ? pattern.thumbnail : `${API_BASE}${pattern.thumbnail}`}
                                                                    alt={pattern.name}
                                                                    className="w-full h-full object-contain"
                                                                    onError={(e) => {
                                                                        // Fallback to main image if thumbnail fails
                                                                        const mainUrl = pattern.url.startsWith('http') ? pattern.url : `${API_BASE}${pattern.url}`;
                                                                        e.target.src = mainUrl;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={pattern.url.startsWith('http') ? pattern.url : `${API_BASE}${pattern.url}`}
                                                                    alt={pattern.name}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            )}
                                                        </div>
                                                        {selectedPattern?.id === pattern.id && (
                                                            <div className="absolute top-1 right-1 bg-[#6366f1] text-white rounded-full p-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center truncate">
                                                            {pattern.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedCategory && patterns.length === 0 && (
                                        <div className="mb-4 p-8 text-center bg-[#2F2E2E] rounded-lg">
                                            <p className="text-sm text-[#808080]">No patterns in this category. Upload one to get started!</p>
                                        </div>
                                    )}

                                    {selectedPattern && (
                                        <div className="mt-3 bg-[#6366f1] text-white px-4 py-3 rounded-lg text-base text-center font-semibold">
                                            Selected: {selectedPattern.name}
                                        </div>
                                    )}
                                </div>

                                {/* Pattern Intricacy */}
                                <div className="mb-6">
                                    <label className="text-base text-[#808080] block mb-3 font-medium">
                                        Pattern Intricacy ({patternIntricacy})
                                    </label>
                                    <select
                                        value={patternIntricacy}
                                        onChange={(e) => setPatternIntricacy(e.target.value)}
                                        className="w-full bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-4 py-3 text-base"
                                    >
                                        <option value="low">Low</option>
                                        <option value="standard">Standard</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                {/* Pattern Symmetry */}
                                <div className="mb-6">
                                    <label className="text-base text-[#808080] block mb-3 font-medium">Pattern Symmetry</label>
                                    <select
                                        value={patternSymmetry}
                                        onChange={(e) => setPatternSymmetry(e.target.value)}
                                        className="w-full bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-4 py-3 text-base"
                                    >
                                        <option value="none">None</option>
                                        <option value="horizontal">Horizontal</option>
                                        <option value="vertical">Vertical</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                {/* Offset Border */}
                                <div className="mb-6">
                                    <label className="text-base text-[#808080] block mb-3 font-medium">Offset Border (Inset Effect)</label>
                                    <select
                                        value={offsetBorder}
                                        onChange={(e) => setOffsetBorder(e.target.value)}
                                        className="w-full bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-4 py-3 text-base"
                                    >
                                        <option value="disabled">Disabled</option>
                                        <option value="1mm">1mm</option>
                                        <option value="2mm">2mm</option>
                                        <option value="3mm">3mm</option>
                                    </select>
                                </div>

                                {/* Generate Button */}
                                <div className="mt-auto">
                                    <PrimaryButton
                                        text={isGenerating ? "Generating..." : "Generate Design"}
                                        onClick={handleGenerate}
                                        disabled={!outlineImage || !selectedPatternFile || isGenerating}
                                        className="w-full py-4 text-lg font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
