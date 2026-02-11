import SecondaryButton from "./SecondaryButton";
import { router } from "@inertiajs/react";

export default function Styles(){
    return(
        <div className="mt-50 container mx-auto px-4">
        <h2 className="sub-head text-center">A World of <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent">Styles</span> Awaits</h2>
        <p className="main-p mt-5 mx-auto text-center max-w-[640px]">From classic Acanthus scrolls to rugged Western tooling, find the perfect pattern.</p>
        <div className="mt-10 flex flex-col xl:flex-row gap-10 justify-center items-center">
            <div>
                <img src="/assets/Style1.png" alt="" />
            </div>
            <div className="">
                <div className="flex flex-col lg:flex-row gap-10">
                    <img src="/assets/Style2.png" alt="" />
                    <img src="/assets/Style3.png" alt="" />
                </div>
                <img src="/assets/Style4.png" alt="" className="mt-11"/>
                <div className="mt-14 w-full flex justify-center ">
                <SecondaryButton
                    text="Explore All Styles ➜"
                    className="w-full"
                    onClick={() => router.visit("/style-examples")}
                />
                </div>
            </div>
        </div>
        </div>
    )
}
