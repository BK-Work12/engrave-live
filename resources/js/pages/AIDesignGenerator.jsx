import { useState } from "react";

import DesignGeneratorHeader from "../components/DesignGeneratorHeader";
import Result from "../components/Result";
import Upload from "../components/Upload";
import Generate from "../components/Generate";
import { usePatternEngraver } from "../hooks/usePatternEngraver";
import { stylesData } from "../Data/stylesData";

export default function AIDesignGenerator() {
    const patternEngraver = usePatternEngraver();

    const handleGenerate = (params) => {
        const { selectedStyle, intricacy, direction, offsetBorder } = params;

        // 1. Find matching style option from stylesData
        let styleImages = [];

        // Search through categories (metal, leather, other)
        for (const category of Object.values(stylesData)) {
            const options = category.options || {};
            const match = Object.values(options).find(opt => opt.text === selectedStyle);
            if (match && match.images) {
                styleImages = match.images;
                break;
            }
        }

        // Fallback: if no style match, check design slider or previous behavior
        if (styleImages.length === 0) {
            styleImages = Array.from({ length: 11 }, (_, i) => `/assets/design${i + 1}.png`);
        }

        if (styleImages.length > 0) {
            const randomImg = styleImages[Math.floor(Math.random() * styleImages.length)];
            patternEngraver.handlePatternSelect(randomImg);
        } else {
            console.warn("No images found for style:", selectedStyle);
        }

        // 2. Map Intricacy to Scale
        let newScale = 1;
        switch (intricacy) {
            case "Sparse": newScale = 2.0; break;
            case "Simple": newScale = 1.5; break;
            case "Standard": newScale = 1.0; break;
            case "Complex": newScale = 0.5; break;
            case "Intricate": newScale = 0.25; break;
        }
        patternEngraver.updateSetting('scale', newScale);

        // 3. Map Symmetry to Tiling
        let tH = true;
        let tV = true;

        // If it's a pattern generator, "None" should still feel filled.
        // But we respect the user's choice:
        switch (direction) {
            case "None": tH = false; tV = false; break;
            case "Vertical": tH = false; tV = true; break;
            case "Horizontal": tH = true; tV = false; break;
            case "Vertical & Horizontal": tH = true; tV = true; break;
        }

        patternEngraver.updateSetting('tileH', tH);
        patternEngraver.updateSetting('tileV', tV);

        // 4. Apply Offset Border
        patternEngraver.updateSetting('outlineOffset', offsetBorder ? 4 : 0);

        // 5. Center and reset positions for a clean "exact filled" experience
        patternEngraver.updateSetting('posX', 0);
        patternEngraver.updateSetting('posY', 0);
        patternEngraver.updateSetting('rotation', 0);
    };

    return (
        <>
            {/* <DesignGeneratorHeader title="AI Design Generator" /> */}
            <div className="container flex flex-col lg:flex-row justify-center items-stretch mx-auto mt-12 mb-15">
                <div className="flex flex-col justify-center px-4 items-stretch w-full lg:flex-row gap-8">
                    {/* Left: Controls */}
                    <div className="w-full lg:w-1/3">
                        <Generate className="w-full" onGenerate={handleGenerate} />
                    </div>

                    {/* Center: Result */}
                    <Result
                        className="w-full lg:w-1/3"
                        patternEngraver={patternEngraver}
                    />

                    {/* Right: Upload */}
                    <div className="flex flex-col mx-auto justify-start gap-7 w-full lg:w-1/3">
                        <Upload onUpload={patternEngraver.handleUpload} className="w-full" />
                    </div>
                </div>
            </div>
        </>
    )
}
