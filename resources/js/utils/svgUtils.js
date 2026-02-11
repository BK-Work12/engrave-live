// SVG utility functions
export const adjustSvgStrokeWidth = (svgText, newStrokeWidth) => {
    // Parse SVG and adjust stroke-width attributes
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // Find all elements with stroke-width
    const elementsWithStroke = svgElement.querySelectorAll('[stroke-width]');
    elementsWithStroke.forEach(el => {
        el.setAttribute('stroke-width', newStrokeWidth);
    });
    
    // Also set default stroke-width for elements with stroke but no stroke-width
    const elementsWithStrokeOnly = svgElement.querySelectorAll('[stroke]:not([stroke-width])');
    elementsWithStrokeOnly.forEach(el => {
        el.setAttribute('stroke-width', newStrokeWidth);
    });
    
    return new XMLSerializer().serializeToString(svgElement);
};

export const svgToDataUrl = (svgText) => {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
};

export const extractStrokeWidth = (svgText) => {
    const match = svgText.match(/stroke-width=["']?([\d.]+)/i);
    return match ? parseFloat(match[1]) : 1;
};
