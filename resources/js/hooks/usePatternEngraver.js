import { useState, useRef } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export function usePatternEngraver() {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imageSize, setImageSize] = useState(null);
    const [maskDataUrl, setMaskDataUrl] = useState(null);
    const [maskBounds, setMaskBounds] = useState(null);
    const [selectedPattern, setSelectedPattern] = useState(null);
    const [processedPatterns, setProcessedPatterns] = useState({});

    // Default settings
    const [settings, setSettings] = useState({
        scale: 1,
        rotation: 0,
        posX: 0,
        posY: 0,
        stagger: 0,
        outlineOffset: 0,
        tileH: false, // Default to FALSE for "One time exact filled"
        tileV: false, // Default to FALSE for "One time exact filled"
        invert: false,
    });

    const updateSetting = (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const processPattern = (patternImg) => {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
            tempCanvas.width = patternImg.width;
            tempCanvas.height = patternImg.height;
            tempCtx.drawImage(patternImg, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            const w = tempCanvas.width;
            const h = tempCanvas.height;

            let minX = w, minY = h, maxX = 0, maxY = 0;
            let foundContent = false;

            for (let i = 0; i < data.length; i += 4) {
                // DO NOT remove background by color, as it can crop details like eagle heads.
                // Only consider non-transparent pixels as content.
                if (data[i + 3] > 0) {
                    foundContent = true;
                    const x = (i / 4) % w;
                    const y = Math.floor((i / 4) / w);
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }

            if (!foundContent) {
                resolve(tempCanvas.toDataURL());
                return;
            }

            // Create a cropped canvas that fits the content exactly
            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;
            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = cropW;
            croppedCanvas.height = cropH;
            const croppedCtx = croppedCanvas.getContext("2d");

            croppedCtx.putImageData(tempCtx.getImageData(minX, minY, cropW, cropH), 0, 0);
            resolve(croppedCanvas.toDataURL());
        });
    };

    const createMaskFromImage = (img) => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            canvas.width = img.width;
            canvas.height = img.height;

            // Fill white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const w = canvas.width;
            const h = canvas.height;

            // Step 1: Detect boundaries (lines/silhouette)
            const isBoundary = new Uint8Array(w * h);
            let silMinX = w, silMinY = h, silMaxX = 0, silMaxY = 0;
            let hasSil = false;

            for (let idx = 0; idx < w * h; idx++) {
                const i = idx * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                const lum = (r + g + b) / 3;

                // Anything that isn't background (white or transparent) is a boundary/line
                if (a > 10 && lum < 248) {
                    isBoundary[idx] = 1;
                    const px = idx % w;
                    const py = Math.floor(idx / w);
                    if (px < silMinX) silMinX = px;
                    if (px > silMaxX) silMaxX = px;
                    if (py < silMinY) silMinY = py;
                    if (py > silMaxY) silMaxY = py;
                    hasSil = true;
                }
            }

            // Step 2: Aggressive Dilation to close gaps in the outline
            const dilatedBoundary = new Uint8Array(w * h);
            for (let y = 2; y < h - 2; y++) {
                for (let x = 2; x < w - 2; x++) {
                    const idx = y * w + x;
                    if (isBoundary[idx]) {
                        // 5x5 dilation
                        for (let dy = -2; dy <= 2; dy++) {
                            for (let dx = -2; dx <= 2; dx++) {
                                dilatedBoundary[idx + dy * w + dx] = 1;
                            }
                        }
                    }
                }
            }

            // Step 3: Region growing/Flood fill
            const visited = new Uint8Array(w * h);
            const regions = [];

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = y * w + x;
                    if (visited[idx] || dilatedBoundary[idx]) continue;

                    const region = [];
                    const queue = [idx];
                    visited[idx] = 1;
                    let touchesBorder = false;

                    while (queue.length > 0) {
                        const cIdx = queue.shift();
                        region.push(cIdx);
                        const cx = cIdx % w;
                        const cy = Math.floor(cIdx / w);

                        if (cx === 0 || cx === w - 1 || cy === 0 || cy === h - 1) {
                            touchesBorder = true;
                        }

                        // Neighbors (4-way)
                        const neighbors = [cIdx + 1, cIdx - 1, cIdx + w, cIdx - w];
                        // Validate coords for wrap-around safety (simplified check)
                        if (cx < w - 1 && !visited[cIdx + 1] && !dilatedBoundary[cIdx + 1]) { visited[cIdx + 1] = 1; queue.push(cIdx + 1); }
                        if (cx > 0 && !visited[cIdx - 1] && !dilatedBoundary[cIdx - 1]) { visited[cIdx - 1] = 1; queue.push(cIdx - 1); }
                        if (cy < h - 1 && !visited[cIdx + w] && !dilatedBoundary[cIdx + w]) { visited[cIdx + w] = 1; queue.push(cIdx + w); }
                        if (cy > 0 && !visited[cIdx - w] && !dilatedBoundary[cIdx - w]) { visited[cIdx - w] = 1; queue.push(cIdx - w); }
                    }
                    regions.push({ pixels: region, touchesBorder });
                }
            }

            const fillMask = new Uint8Array(w * h);
            let minX = w, minY = h, maxX = 0, maxY = 0;
            let hasFill = false;

            for (const region of regions) {
                // Larger threshold (100 pixels) to avoid noise
                if (!region.touchesBorder && region.pixels.length > 100) {
                    hasFill = true;
                    for (const pIdx of region.pixels) {
                        fillMask[pIdx] = 1;
                        const px = pIdx % w;
                        const py = Math.floor(pIdx / w);
                        if (px < minX) minX = px;
                        if (px > maxX) maxX = px;
                        if (py < minY) minY = py;
                        if (py > maxY) maxY = py;
                    }
                }
            }

            // Fallback: If no internal "hole" was found, use the bounding box of the silhouette itself
            if (!hasFill && hasSil) {
                hasFill = true;
                minX = silMinX; maxX = silMaxX; minY = silMinY; maxY = silMaxY;
                // For a fallback, we fill the entire silhouette area
                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        fillMask[y * w + x] = 1;
                    }
                }
            }

            for (let idx = 0; idx < w * h; idx++) {
                const i = idx * 4;
                if (fillMask[idx]) {
                    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
                } else {
                    data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
                }
            }

            const bounds = hasFill ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;

            ctx.putImageData(imageData, 0, 0);
            resolve({ dataUrl: canvas.toDataURL(), bounds });
        });
    };

    const handleUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => {
            const vectorImg = new Image();
            vectorImg.src = ev.target.result;
            vectorImg.onload = async () => {
                setUploadedImage(ev.target.result);
                setImageSize({ width: vectorImg.width, height: vectorImg.height });
                const { dataUrl, bounds } = await createMaskFromImage(vectorImg);
                setMaskDataUrl(dataUrl);
                setMaskBounds(bounds);
            };
        };
    };

    const handlePatternSelect = (patternUrl) => {
        setSelectedPattern(patternUrl);
        if (patternUrl && !processedPatterns[patternUrl]) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = patternUrl;
            img.onload = async () => {
                const processed = await processPattern(img);
                setProcessedPatterns(prev => ({ ...prev, [patternUrl]: processed }));
            };
        }
    };

    const handleDownloadSvg = async (svgRef, filename = "engrave-design.svg") => {
        if (!svgRef.current) return;

        try {
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error", error);
            alert("An error occurred. Please try again.");
        }
    };

    const handlePatternUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => {
            handlePatternSelect(ev.target.result);
        };
    };

    return {
        uploadedImage,
        imageSize,
        maskDataUrl,
        maskBounds,
        selectedPattern,
        processedPatterns,
        settings,
        updateSetting,
        handleUpload,
        handlePatternSelect,
        handlePatternUpload,
        handleDownloadSvg
    };
}
