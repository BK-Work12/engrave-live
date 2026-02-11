import { useRef } from 'react';

export default function Upload({ onUpload, className }) {
    const fileInputRef = useRef(null);

    return (
        <div className={`bg-[#171616] max-w-[364px] pb-7 pt-4 px-3 mx-auto rounded-[30px] ${className}`}>
            <div
                className="border border-dashed border-[#616161] rounded-2xl flex flex-col items-center bg-[#0D0D0D] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => onUpload && onUpload(e.target.files?.[0])}
                    style={{ display: 'none' }}
                    accept=".png,.jpg,.jpeg,.svg"
                />
                <div className="px-9 text-center mx-auto pt-22 pb-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="0 0 74 74" fill="none" className="mx-auto">
                        <path d="M9.25 49.3333L23.0325 35.5508C23.5507 35.0325 24.166 34.6213 24.8432 34.3407C25.5204 34.0602 26.2462 33.9158 26.9792 33.9158C27.7122 33.9158 28.438 34.0602 29.1151 34.3407C29.7923 34.6213 30.4076 35.0325 30.9258 35.5508L43.1667 47.7917M43.1667 47.7917L47.7917 52.4167M43.1667 47.7917L49.2408 41.7175C49.7591 41.1991 50.3744 40.788 51.0515 40.5074C51.7287 40.2269 52.4545 40.0825 53.1875 40.0825C53.9205 40.0825 54.6463 40.2269 55.3235 40.5074C56.0006 40.788 56.6159 41.1991 57.1342 41.7175L64.75 49.3333" stroke="#616161" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M36.9997 7.70833C23.9572 7.70833 17.4359 7.70833 13.1131 11.4022C12.4964 11.9284 11.926 12.4988 11.4018 13.1134C7.70801 17.4362 7.70801 23.9575 7.70801 37C7.70801 50.0425 7.70801 56.5637 11.4018 60.8866C11.9281 61.5032 12.4985 62.0737 13.1131 62.5978C17.4359 66.2917 23.9572 66.2917 36.9997 66.2917C50.0422 66.2917 56.5634 66.2917 60.8863 62.5978C61.5029 62.0716 62.0733 61.5012 62.5975 60.8866C66.2913 56.5637 66.2913 50.0425 66.2913 37M66.2913 18.5H55.4997M55.4997 18.5H44.708M55.4997 18.5V7.70833M55.4997 18.5V29.2917" stroke="#616161" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-medium text-[#808080] mt-4 block">Click or drag to upload a files (PNG, JPG, or SVG) </span>
                </div>
            </div>
            <p className="text-xs mt-4 text-center pb-4 text-[#808080]">SVG files will be converted to PNG</p>
        </div>
    )
}