import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import { router } from "@inertiajs/react";

export default function Hero() {
    return (
        <>
            <div className="mx-auto text-center flex items-center justify-center px-4">
                <div className="mt-15 max-w-[780px] mx-auto text-center relative ">
                    <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                    <div className="relative">
                        <h1 className="main-head">Instant Scrollwork for <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent">Your Designs</span></h1>
                        <p className="main-p mt-7.5">Automatically generate intricate, beautiful fill patterns for any shape. Perfect for laser engraving, leather tooling, and digital art.</p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mt-28.5 relative">
                        <PrimaryButton text="Start Creating Now" onClick={() => router.visit("/create")}/>
                        <SecondaryButton text="How It Works" onClick={() => router.visit("/how-it-works")}/>
                    </div>
                </div>
            </div>
        </>
    )
}
