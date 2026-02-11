import { useRef } from "react";

export default function DesignsSlider({ designs = [], onSelect, selectedId, onUploadCustom }) {
    const fileInputRef = useRef(null);

    return (
        <div className="mt-8">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => onUploadCustom && onUploadCustom(e.target.files?.[0])}
            />
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scroll no-scrollbar">
                {/* Custom Upload Button as first item */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="min-w-[74px] h-[74px] bg-[#2F2E2E] rounded-xl flex flex-col justify-center items-center cursor-pointer hover:bg-[#3F3E3E] transition-colors shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] text-[#808080] mt-1">Upload Custom</span>
                </div>

                {designs.map((design) => (
                    <div key={design.id} className="flex flex-col items-center gap-1 shrink-0">
                        <div
                            onClick={() => onSelect(design.src, design.id)}
                            className={`min-w-[74px] h-[74px] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedId === design.id
                                ? "border-[#C459C6]"
                                : "border-transparent"
                                }`}
                        >
                            <img
                                src={design.src}
                                alt={design.alt}
                                className="w-full h-full object-cover bg-white"
                            />
                        </div>
                        <span className="text-[10px] text-[#808080] truncate max-w-[74px]">
                            {design.src.split('/').pop()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
