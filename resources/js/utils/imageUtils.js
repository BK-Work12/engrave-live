/**
 * Resizes an image if it exceeds a maximum dimension, preserving aspect ratio.
 * Returns a Base64 string of the resized image (JPEG format).
 */
export const resizeImage = (file, maxDimension = 1024) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Return pure base64 data without prefix for easy API usage, or with prefix for display
                // Standard toDataURL returns "data:image/jpeg;base64,..."
                resolve(canvas.toDataURL('image/jpeg', 0.9)); 
            };
            img.onerror = (err) => reject(err);
            if (event.target?.result) {
                img.src = event.target.result;
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

/**
 * Strips the data URL prefix (e.g., "data:image/jpeg;base64,") to get raw base64 string.
 */
export const stripBase64Prefix = (dataUrl) => {
    return dataUrl.split(',')[1] || dataUrl;
};
