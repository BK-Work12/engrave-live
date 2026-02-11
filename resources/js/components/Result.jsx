import { useRef, useState } from "react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import DesignsSlider from "./DesignsSlider";
import { SliderData } from "../Data/SliderData";
import { usePage, router } from "@inertiajs/react";

export default function Result({ className, patternEngraver }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const svgRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);

    const {
        maskDataUrl,
        maskBounds,
        imageSize,
        uploadedImage,
        selectedPattern,
        processedPatterns,
        settings,
        handlePatternSelect,
        handlePatternUpload,
        handleDownloadSvg
    } = patternEngraver || {};

    const handleSelect = (src, id) => {
        setSelectedId(id);
        if (handlePatternSelect) handlePatternSelect(src);
    };

    // Styling constants
    const tileBase = 160;
    const scale = settings?.scale || 1;

    // Use mask bounds if available to "Fit to Every Corner"
    const bounds = maskBounds || { x: 0, y: 0, width: imageSize?.width || 0, height: imageSize?.height || 0 };

    const isTiledH = settings?.tileH === true;
    const isTiledV = settings?.tileV === true;

    // Use tileBase when repeating, otherwise use full image size for exact fill
    // For exact fill (None symmetry), fill entire canvas - mask will clip to shape
    const effectiveTileW = isTiledH ? (tileBase * scale) : (imageSize?.width || bounds.width);
    const effectiveTileH = isTiledV ? (tileBase * scale) : (imageSize?.height || bounds.height);

    const rotation = settings?.rotation || 0;
    // For exact fill, start at 0,0 to fill entire canvas - mask clips to shape
    const posX = isTiledH ? (settings?.posX || 0) : 0;
    const posY = isTiledV ? (settings?.posY || 0) : 0;
    const stagger = settings?.stagger || 0;

    const transform = `rotate(${rotation}) translate(${posX} ${posY}) skewX(${stagger})`;
    const invertFilter = settings?.invert ? 'invert(1)' : '';
    const outlineRadius = (settings?.outlineOffset || 0) / 2;

    const processedOnePattern = selectedPattern ? processedPatterns?.[selectedPattern] : null;

    return (
        <div className={`bg-[#171616] max-w-[562px] mx-auto rounded-[30px] p-5 ${className}`}>
            <h2 className="card-head">Result: Engrave-Ready <span className="bg-gradient-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent">Design</span></h2>

            <div className="border border-[#2F2E2E] rounded-xl w-full h-[468px] relative mt-3 flex justify-center items-center overflow-hidden bg-black">
                {maskDataUrl ? (
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${imageSize?.width} ${imageSize?.height}`}
                        className="w-full h-full object-contain"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <filter id="outlineOffsetResult">
                                <feMorphology operator="dilate" radius={outlineRadius} in="SourceAlpha" result="dilated" />
                                <feComposite in="dilated" in2="SourceAlpha" operator="out" result="outline" />
                                <feFlood floodColor="white" result="white" />
                                <feComposite in="white" in2="dilated" operator="in" />
                            </filter>
                            
                            {/* Engraving effect - creates carved/deep appearance */}
                            <filter id="embossEffectResult" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                                <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.4" specularExponent="10" lightingColor="#ffffff" result="specLight">
                                    <fePointLight x="50" y="50" z="100" />
                                </feSpecularLighting>
                                <feComposite in="SourceGraphic" in2="specLight" operator="arithmetic" k1="0" k2="0.5" k3="0.6" k4="0" />
                            </filter>
                            
                            {/* Combined filter for invert + emboss */}
                            <filter id="combinedEngraveResult" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                                <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.4" specularExponent="10" lightingColor="#ffffff" result="specLight">
                                    <fePointLight x="50" y="50" z="100" />
                                </feSpecularLighting>
                                <feComposite in="SourceGraphic" in2="specLight" operator="arithmetic" k1="0" k2="0.5" k3="0.6" k4="0" result="engraved" />
                                <feColorMatrix in="engraved" type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" />
                            </filter>
                            
                            <pattern id="engravePatternResult" patternUnits="userSpaceOnUse" width={effectiveTileW} height={effectiveTileH} patternTransform={transform}>
                                <image
                                    href={processedOnePattern || selectedPattern}
                                    width={effectiveTileW}
                                    height={effectiveTileH}
                                    preserveAspectRatio="none"
                                    style={{ filter: invertFilter }}
                                />
                            </pattern>
                            <mask id="shapeMaskResult">
                                <image
                                    href={maskDataUrl}
                                    width={imageSize?.width}
                                    height={imageSize?.height}
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{ filter: outlineRadius > 0 ? 'url(#outlineOffsetResult)' : 'none' }}
                                />
                            </mask>
                            <filter id="dilateMaskResult">
                                <feMorphology operator="dilate" radius={outlineRadius} />
                            </filter>
                            <mask id="finalMaskResult">
                                <image
                                    href={maskDataUrl}
                                    width={imageSize?.width}
                                    height={imageSize?.height}
                                    preserveAspectRatio="xMidYMid meet"
                                    filter={outlineRadius > 0 ? "url(#dilateMaskResult)" : ""}
                                />
                            </mask>
                        </defs>
                        {/* Background - white base */}
                        <rect width={imageSize?.width} height={imageSize?.height} fill="white" />
                        
                        {/* Original vector image as reference (semi-transparent) */}
                        <image href={uploadedImage} width={imageSize?.width} height={imageSize?.height} preserveAspectRatio="xMidYMid meet" opacity="0.2" />

                        {/* Pattern layer - engraved into the shape */}
                        {selectedPattern && (!isTiledH && !isTiledV) ? (
                            /* Exact fill mode - pattern fits within bounds maintaining aspect ratio, mask clips to shape */
                            (() => {
                                // Use full canvas size - pattern will scale to fit while maintaining aspect ratio
                                const canvasW = imageSize?.width || 0;
                                const canvasH = imageSize?.height || 0;
                                
                                // Calculate rotation center (center of canvas)
                                const rotCenterX = canvasW / 2;
                                const rotCenterY = canvasH / 2;
                                
                                return (
                                    <image
                                        href={processedOnePattern || selectedPattern}
                                        x="0"
                                        y="0"
                                        width={canvasW}
                                        height={canvasH}
                                        preserveAspectRatio="xMidYMid meet"
                                        mask="url(#finalMaskResult)"
                                        style={{ filter: invertFilter || 'none' }}
                                        transform={rotation !== 0 ? `rotate(${rotation} ${rotCenterX} ${rotCenterY})` : undefined}
                                    />
                                );
                            })()
                        ) : selectedPattern ? (
                            /* Tiled mode - pattern repeats */
                            <rect
                                x="0"
                                y="0"
                                width={imageSize?.width || bounds.width}
                                height={imageSize?.height || bounds.height}
                                fill="url(#engravePatternResult)"
                                mask="url(#finalMaskResult)"
                                style={{ filter: invertFilter || 'none' }}
                            />
                        ) : null}
                    </svg>
                ) : (
                    <span className="text-sm font-medium text-[#616161] absolute">Your generated design will appear here.</span>
                )}
            </div>

            {/* Pattern Selection */}
            {maskDataUrl && (
                <div className="mt-4">
                    <DesignsSlider
                        onSelect={handleSelect}
                        selectedId={selectedId}
                        designs={SliderData}
                        onUploadCustom={handlePatternUpload}
                    />
                </div>
            )}

            {!user && (
                <div className="mt-8 flex flex-col justify-center lg:flex-row gap-4.5 w-full">
                    <PrimaryButton text="Sign In" className="w-full" onClick={() => router.visit('/login')} />
                    <div className="w-full" onClick={() => handleDownloadSvg && handleDownloadSvg(svgRef)}>
                        <SecondaryButton text="Download SVG" className="w-full" />
                    </div>
                    <PrimaryButton text="Open In SVG Tool" className="bg-none w-full border border-[#F5F5FF]" onClick={() => router.visit('/svg-tracing-tool')} />
                </div>
            )}
        </div>
    )
}
