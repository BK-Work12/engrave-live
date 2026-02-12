import React, { useState, useEffect } from "react";
import AdvancedImageEditor from "../components/AdvancedImageEditor";

export default function ImageEditor() {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get image URL from query parameter or sessionStorage
        try {
            const params = new URLSearchParams(window.location.search);
            let url = params.get('image');
            
            // If not in URL param, check sessionStorage
            if (!url && typeof window !== 'undefined') {
                url = sessionStorage.getItem('editorImageUrl');
            }
            
            if (url) {
                setImageUrl(url);
            } else {
                setError("No image URL provided. Please select an image to edit from the generator.");
            }
        } catch (err) {
            setError("Error loading image: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleClose = () => {
        // Clear sessionStorage
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('editorImageUrl');
        }
        window.close();
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
                <div className="bg-[#171616] rounded-[30px] p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Error</h2>
                    <p className="text-[#808080] mb-6">{error}</p>
                    <button
                        onClick={handleClose}
                        className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-3 rounded-lg text-base font-semibold"
                    >
                        Close Tab
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || !imageUrl) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
                <div className="bg-[#171616] rounded-[30px] p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Loading Canvas Editor...</h2>
                    <p className="text-[#808080]">Please wait...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-[#171616] rounded-[30px] p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-semibold text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
                            </svg>
                            Canvas Design Editor
                        </h1>
                        <button
                            onClick={handleClose}
                            className="text-[#808080] hover:text-white transition-colors p-2"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="bg-[#0D0D0D] rounded-xl p-6 border border-[#2F2E2E]">
                        <AdvancedImageEditor
                            imageUrl={imageUrl}
                            autoOpen={true}
                            onSave={(url, blob) => {
                                // Image is saved and downloaded automatically
                                console.log("Image saved and downloaded");
                            }}
                            onClose={handleClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
