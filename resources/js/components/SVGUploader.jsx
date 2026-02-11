import { useRef, useState } from 'react';
import axios from 'axios';
import DesignsSlider from './DesignsSlider';
import { SliderData } from '../Data/SliderData';

export default function DesignUploader({
    className,
    onDesignUploaded,
    // Hook props
    uploadedImage,
    maskDataUrl,
    imageSize,
    selectedPattern,
    processedPatterns,
    settings,
    handleUpload,
    handlePatternSelect,
    svgRef: propSvgRef // Accept ref from parent
}) {
    const fileInputRef = useRef(null);
    const localSvgRef = useRef(null);
    const svgRef = propSvgRef || localSvgRef;
    const [selectedId, setSelectedId] = useState(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Local Preview Prep
        if (handleUpload) handleUpload(file);

        // 2. Server Upload (Original Logic)
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('/designs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (onDesignUploaded) {
                onDesignUploaded(response.data.design);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleSelect = (src, id) => {
        setSelectedId(id);
        if (handlePatternSelect) handlePatternSelect(src);
    };

    // Styling constants
    const tileBase = 160;
    const scale = settings?.scale || 1;
    const effectiveTileW = settings?.tileH === false ? imageSize?.width : (tileBase * scale);
    const effectiveTileH = settings?.tileV === false ? imageSize?.height : (tileBase * scale);
    const rotation = settings?.rotation || 0;
    const posX = settings?.posX || 0;
    const posY = settings?.posY || 0;
    const stagger = settings?.stagger || 0;
    const transform = `rotate(${rotation}) translate(${posX} ${posY}) skewX(${stagger})`;
    const invertFilter = settings?.invert ? 'invert(1)' : 'none';
    const outlineRadius = (settings?.outlineOffset || 0) / 2;

    const processedOnePattern = selectedPattern ? processedPatterns?.[selectedPattern] : null;

    return (
        <div className={`bg-[#171616] rounded-[30px] mx-4 lg:mx-0 w-full px-4 max-w-[901px] ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                style={{ display: 'none' }}
                accept=".png,.jpg,.jpeg,.svg"
            />

            {!maskDataUrl ? (
                <div
                    className="border border-[#616161] max-w-[352px] rounded-xl mx-auto my-27.5 cursor-pointer hover:border-white transition-colors"
                    onClick={handleClick}
                >
                    <div className="flex flex-col py-11 justify-center items-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="0 0 74 74" fill="none">
                            <path d="M9.25 49.3333L23.0325 35.5508C23.5507 35.0325 24.166 34.6213 24.8432 34.3407C25.5204 34.0602 26.2462 33.9158 26.9792 33.9158C27.7122 33.9158 28.438 34.0602 29.1151 34.3407C29.7923 34.6213 30.4076 35.0325 30.9258 35.5508L43.1667 47.7917M43.1667 47.7917L47.7917 52.4167M43.1667 47.7917L49.2408 41.7175C49.7591 41.1991 50.3744 40.788 51.0515 40.5074C51.7287 40.2269 52.4545 40.0825 53.1875 40.0825C53.9205 40.0825 54.6463 40.2269 55.3235 40.5074C56.0006 40.788 56.6159 41.1991 57.1342 41.7175L64.75 49.3333" stroke="#616161" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M36.9997 7.70833C23.9572 7.70833 17.4359 7.70833 13.1131 11.4022C12.4964 11.9284 11.926 12.4988 11.4018 13.1134C7.70801 17.4362 7.70801 23.9575 7.70801 37C7.70801 50.0425 7.70801 56.5637 11.4018 60.8866C11.9281 61.5032 12.4985 62.0737 13.1131 62.5978C17.4359 66.2917 23.9572 66.2917 36.9997 66.2917C50.0422 66.2917 56.5634 66.2917 60.8863 62.5978C61.5029 62.0716 62.0733 61.5012 62.5975 60.8866C66.2913 56.5637 66.2913 50.0425 66.2913 37M66.2913 18.5H55.4997M55.4997 18.5H44.708M55.4997 18.5V7.70833M55.4997 18.5V29.2917" stroke="#616161" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="mt-6 text-sm text-[#808080]">Upload Outline/Silhouette</span>
                        <p className="text-xs mt-13">Drop your PNG, JPG or SVG here</p>
                    </div>
                </div>
            ) : (
                <div className="relative flex justify-center items-center py-10 min-h-[500px]">
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                        <button
                            onClick={handleClick}
                            className="bg-[#2F2E2E] hover:bg-[#3F3E3E] text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-[#616161] transition-all shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="text-sm">Replace</span>
                        </button>
                        {/* Download Button */}
                        <button
                            onClick={() => handleDownloadSvg && handleDownloadSvg(svgRef)}
                            className="bg-[#C459C6] hover:bg-[#a34ca5] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span className="text-sm">Download SVG</span>
                        </button>
                    </div>
                    <svg ref={svgRef} viewBox={`0 0 ${imageSize?.width} ${imageSize?.height}`} className="w-full h-full max-h-[600px] object-contain" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <filter id="outlineOffsetUpload">
                                <feMorphology operator="dilate" radius={outlineRadius} in="SourceAlpha" result="dilated" />
                                <feComposite in="dilated" in2="SourceAlpha" operator="out" result="outline" />
                                <feFlood floodColor="white" result="white" />
                                <feComposite in="white" in2="dilated" operator="in" />
                            </filter>
                            <pattern id="engravePatternUpload" patternUnits="userSpaceOnUse" width={effectiveTileW} height={effectiveTileH} patternTransform={transform}>
                                <image href={processedOnePattern || selectedPattern} width={effectiveTileW} height={effectiveTileH} preserveAspectRatio="xMidYMid slice" style={{ filter: invertFilter }} />
                            </pattern>
                            <mask id="shapeMaskUpload">
                                <image
                                    href={maskDataUrl}
                                    width={imageSize?.width}
                                    height={imageSize?.height}
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{ filter: outlineRadius > 0 ? 'url(#outlineOffsetUpload)' : 'none' }}
                                />
                            </mask>
                            <filter id="dilateMaskUpload">
                                <feMorphology operator="dilate" radius={outlineRadius} />
                            </filter>
                        </defs>
                        <rect width={imageSize?.width} height={imageSize?.height} fill="white" />
                        <image href={uploadedImage} width={imageSize?.width} height={imageSize?.height} preserveAspectRatio="xMidYMid meet" opacity="0.3" />
                        <mask id="finalMaskUpload">
                            <image
                                href={maskDataUrl}
                                width={imageSize?.width}
                                height={imageSize?.height}
                                preserveAspectRatio="xMidYMid meet"
                                filter={outlineRadius > 0 ? "url(#dilateMaskUpload)" : ""}
                            />
                        </mask>
                        <rect width={imageSize?.width} height={imageSize?.height} fill="url(#engravePatternUpload)" mask="url(#finalMaskUpload)" />
                    </svg>
                </div>
            )}

            <DesignsSlider
                onSelect={handleSelect}
                selectedId={selectedId}
                onUploadCustom={handleClick}
                designs={SliderData}
            />
        </div>
    );
}