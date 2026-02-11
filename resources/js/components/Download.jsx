import PrimaryButton from "./PrimaryButton";

export default function Download() {
    return (
        <>
            <div className="bg-[#171616] mx-4 lg:mx-0  rounded-[30px] ">
                <div className="p-4.5 flex flex-col gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="74" height="74" viewBox="0 0 74 74" fill="none">
                        <path d="M41.6253 9.25H37.0003H24.667C19.5584 9.25 15.417 13.3914 15.417 18.5V55.5C15.417 60.6088 19.5584 64.75 24.667 64.75H37.0003M41.6253 9.25L58.5837 26.5937M41.6253 9.25V23.5104C41.6253 25.2133 43.0057 26.5937 44.7087 26.5937H58.5837M58.5837 26.5937V36.4219" stroke="#616161" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M53.9583 46.25V64.75M53.9583 64.75L46.25 57.0417M53.9583 64.75L61.6667 57.0417" stroke="#616161" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span className="text-sm font-medium text-[#D6D6D6]">Tips & Tricks Guide v1.1</span>
                    <span className="text-xs text-[#D6D6D6]">Download our comprehensive guide</span>
                    <PrimaryButton text="Download PDF" className="w-full" />
                </div>
            </div>
        </>
    )
}