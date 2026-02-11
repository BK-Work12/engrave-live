import { stripBase64Prefix } from "../utils/imageUtils";

export const generateOutline = async (imageBase64, config) => {
    try {
        const base64Data = stripBase64Prefix(imageBase64);

        // Call the Laravel backend to generate the outline
        const response = await fetch('/api/generate-outline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_base64: base64Data,
                detail_level: config.detailLevel,
                thickness: config.thickness,
                resolution: config.resolution,
                output_format: config.outputFormat
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.outline_base64) {
            throw new Error("No outline data received from server");
        }

        const fmt = result.format || config.outputFormat || 'png';
        const mime = fmt === 'svg' ? 'image/svg+xml' : 'image/png';
        return `data:${mime};base64,${result.outline_base64}`;

    } catch (error) {
        console.error("Outline Generation Error:", error);
        throw error;
    }
};
