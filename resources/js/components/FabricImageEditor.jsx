import React from "react";

export default function FabricImageEditor({ imageUrl, onSave }) {
    if (!imageUrl) {
        return null;
    }
    
    const openInNewTab = () => {
        // Open image in new tab for editing
        window.open(imageUrl, '_blank');
    };
    
    return (
        <div className="flex gap-2">
            <button
                onClick={openInNewTab}
                className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z" />
                </svg>
                Edit in New Tab
            </button>
        </div>
    );
}
