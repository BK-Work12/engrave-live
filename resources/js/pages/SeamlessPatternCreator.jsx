import React, { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import PrimaryButton from "../components/PrimaryButton";
import FabricImageEditor from "../components/FabricImageEditor";

export default function SeamlessPatternCreator() {
    const outlineInputRef = useRef(null);
    const patternInputRef = useRef(null);
    const [outlineImage, setOutlineImage] = useState(null);
    const [patternImage, setPatternImage] = useState(null);
    const [outlineFile, setOutlineFile] = useState(null);
    const [patternFile, setPatternFile] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatedImageFilename, setGeneratedImageFilename] = useState(null);
    const [editedImage, setEditedImage] = useState(null);
    const [editedImageBlob, setEditedImageBlob] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [borderOffset, setBorderOffset] = useState(0);
    const [validationMessage, setValidationMessage] = useState(null);
    const [validationMessageType, setValidationMessageType] = useState('info'); // 'info', 'warning', 'error'

    const handleOutlineUpload = (file) => {
        if (!file) return;
        setOutlineFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            setOutlineImage(e.target.result);
        };
    };

    const handlePatternUpload = (file) => {
        if (!file) return;
        setPatternFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            setPatternImage(e.target.result);
        };
    };

    const handleReset = () => {
        // Reset all state
        setOutlineImage(null);
        setPatternImage(null);
        setOutlineFile(null);
        setPatternFile(null);
        setGeneratedImage(null);
        setGeneratedImageFilename(null);
        setBorderOffset(0);
        setValidationMessage(null);

        // Reset file inputs
        if (outlineInputRef.current) {
            outlineInputRef.current.value = '';
        }
        if (patternInputRef.current) {
            patternInputRef.current.value = '';
        }
    };

    const handleGenerate = async () => {
        if (!outlineFile || !patternFile) {
            alert("Please upload both outline image and pattern image");
            return;
        }

        setIsGenerating(true);
        try {
            // Laravel backend endpoint
            const formData = new FormData();
            formData.append('outline', outlineFile);
            formData.append('design', patternFile);
            if (borderOffset > 0) {
                formData.append('border_offset', borderOffset.toString());
            }

            const response = await fetch('/api/generator/generate', {
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

            // Extract image URL from response (which could be HTML or JSON)
            const contentType = response.headers.get("content-type");
            let imageUrl = '';
            let filename = '';

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.success && data.image_url) {
                    imageUrl = data.image_url;
                    filename = data.filename;
                } else {
                    throw new Error(data.error || 'Failed to generate image');
                }
            } else {
                // Parse HTML response to extract image URL
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

            // If it's a relative URL, make it absolute
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
            const errorMessage = error.message || 'Unknown error occurred';
            setValidationMessage(`❌ ${errorMessage}`);
            setValidationMessageType('error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageEditorSave = (url, blob) => {
        setEditedImage(url);
        setEditedImageBlob(blob);
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="container flex flex-col justify-center items-center mx-auto mt-12 mb-15 px-4">
                <div className="w-full max-w-4xl">
                    {/* EngraveFill Pro Guidelines Info Box */}
                    <div className="bg-blue-950 border border-blue-700 rounded-[20px] p-4 mb-6">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <span>📋 EngraveFill Pro Guidelines</span>
                        </h4>
                        <ul className="text-xs text-blue-100 space-y-1">
                            <li>✓ Outline: Simple black silhouette on white background (~1200px optimal)</li>
                            <li>✓ Pattern: Detailed, intricate design for seamless tiling</li>
                            <li>✓ No gradients, shadows, or gaps in outline</li>
                            <li>⚠️  Complex shapes cause 'masking' - separate components for best results</li>
                        </ul>
                    </div>

                    {/* Validation Message Display */}
                    {validationMessage && (
                        <div className={`rounded-[20px] p-4 mb-6 border ${
                            validationMessageType === 'error' ? 'bg-red-950 border-red-700 text-red-100' :
                            validationMessageType === 'warning' ? 'bg-yellow-950 border-yellow-700 text-yellow-100' :
                            'bg-blue-950 border-blue-700 text-blue-100'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{validationMessage}</p>
                            <button
                                onClick={() => setValidationMessage(null)}
                                className="mt-2 text-xs underline hover:no-underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {/* Two Image Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Outline Image Input */}
                        <div className="bg-[#171616] rounded-[30px] p-6">
                            <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Outline Image (Shape to fill):
                            </h3>
                            <input
                                type="file"
                                ref={outlineInputRef}
                                className="hidden"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={(e) => handleOutlineUpload(e.target.files?.[0])}
                            />
                            {outlineImage ? (
                                <div className="relative bg-white rounded-xl overflow-hidden">
                                    <img src={outlineImage} alt="Outline" className="w-full h-auto rounded-xl border border-[#616161] object-contain" />
                                    <button
                                        onClick={() => outlineInputRef.current?.click()}
                                        className="absolute top-2 right-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-3 py-1 rounded-lg text-sm"
                                    >
                                        Replace
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => outlineInputRef.current?.click()}
                                    className="border border-dashed border-[#616161] rounded-xl p-8 text-center cursor-pointer hover:border-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[#616161]">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <p className="text-sm text-[#808080] mt-4">Choose File</p>
                                    <p className="text-xs text-[#808080] mt-2">No file chosen</p>
                                </div>
                            )}
                        </div>

                        {/* Pattern Image Input */}
                        <div className="bg-[#171616] rounded-[30px] p-6">
                            <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Design Image (Pattern to use):
                            </h3>
                            <input
                                type="file"
                                ref={patternInputRef}
                                className="hidden"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={(e) => handlePatternUpload(e.target.files?.[0])}
                            />
                            {patternImage ? (
                                <div className="relative">
                                    <img src={patternImage} alt="Pattern" className="w-full h-auto rounded-xl border border-[#616161]" />
                                    <button
                                        onClick={() => patternInputRef.current?.click()}
                                        className="absolute top-2 right-2 bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-3 py-1 rounded-lg text-sm"
                                    >
                                        Replace
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => patternInputRef.current?.click()}
                                    className="border border-dashed border-[#616161] rounded-xl p-8 text-center cursor-pointer hover:border-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[#616161]">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <p className="text-sm text-[#808080] mt-4">Choose File</p>
                                    <p className="text-xs text-[#808080] mt-2">No file chosen</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-[#171616] rounded-[30px] p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                </svg>
                                Border Line (Safe Frame):
                            </h3>
                            <span className="text-[#808080] font-mono bg-[#2F2E2E] px-3 py-1 rounded-lg border border-[#3F3E3E]">
                                {borderOffset.toFixed(1)} mm
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-2 text-sm text-[#D4D4D4]">
                                <input
                                    type="checkbox"
                                    checked={borderOffset > 0}
                                    onChange={(e) => setBorderOffset(e.target.checked ? 1 : 0)}
                                    className="h-4 w-4 accent-[#6366f1]"
                                />
                                Add 1mm border line
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#808080]">Custom</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={borderOffset}
                                    onChange={(e) => setBorderOffset(Math.max(0, Math.min(5, parseFloat(e.target.value || '0'))))}
                                    className="w-24 rounded-md bg-[#2F2E2E] border border-[#3F3E3E] px-2 py-1 text-sm text-white"
                                />
                                <span className="text-xs text-[#808080]">mm</span>
                            </div>
                        </div>
                        <p className="text-xs text-[#616161] mt-2 italic">
                            * Shrinks the fill area to create a clean, framed edge.
                        </p>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center mb-6">
                        <PrimaryButton
                            text={isGenerating ? "Generating..." : "Generate Ornamental Design"}
                            onClick={handleGenerate}
                            disabled={!outlineImage || !patternImage || isGenerating}
                            className="px-8 py-4 text-lg"
                        />
                    </div>

                    {/* Output Display */}
                    <div className="bg-[#171616] rounded-[30px] p-6">
                        <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            Generated Images
                        </h3>
                        {generatedImage ? (
                            <div className="relative">
                                <img
                                    src={generatedImage}
                                    alt="Generated Design"
                                    className="w-full h-auto rounded-xl border border-[#616161] bg-white"
                                />
                                <div className="mt-4 flex justify-center gap-4 flex-wrap flex-col sm:flex-row">
                                    <FabricImageEditor imageUrl={generatedImage} onSave={handleImageEditorSave} />
                                    <PrimaryButton
                                        text="Generate Again"
                                        onClick={handleReset}
                                        className="px-6"
                                    />
                                    <PrimaryButton
                                        text="Generate Outline Design"
                                        onClick={() => {
                                            if (generatedImageFilename) {
                                                // Navigate to outline generator with filename - backend will fetch it
                                                router.visit(`/outline-generator?external_image=${generatedImageFilename}&backend=/api`);
                                            } else {
                                                alert('Image not ready. Please wait for generation to complete.');
                                            }
                                        }}
                                        className="px-6"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#616161] rounded-xl p-12 text-center">
                                <p className="text-sm text-[#808080]">Your generated design will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
