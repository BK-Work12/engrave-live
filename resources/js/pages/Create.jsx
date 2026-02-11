import CreatorTools from "../components/CreatorTools";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { router } from "@inertiajs/react";

export default function Create() {
    return (
        <>
            <div className="mt-15 mx-auto text-center max-w-[780px] relative px-4">
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                <h3 className="main-head relative">Creator Tools</h3>
                <p className="main-p mt-7 relative">Automatically generate intricate, beautiful fill patterns for any shape. Perfect for laser engraving, leather tooling, and digital art.</p>
            </div>
            <div className="mt-35 flex flex-col gap-11 mx-auto justify-center items-center relative px-4">
                <CreatorTools
                    onClick={() => router.visit("/generator")}
                    btnText="Launch Generator"
                    image='/assets/AIDesign.png'
                    head="Pattern Generator"
                    para="Upload an outline and select from our pattern library to fill it with intricate scrollwork and decorative styles. Customize pattern intricacy, symmetry, and SVG export settings."
                />
                <CreatorTools
                    onClick={() => router.visit("/svg-tracing-tool")}
                    btnText="Launch Tracer"
                    image='/assets/SVGTracer.png'
                    head="SVG Tracing Tool"
                    para="Convert your JPG/PNG images to clean SVG vector graphics. Adjustable pre-processing (threshold, contrast) and tracing options for optimal output."
                />
                <CreatorTools
                    onClick={() => router.visit("/seamless-patterns")}
                    btnText="Explore patterns"
                    image='/assets/SeamlessPattern.png'
                    head="Seamless Pattern Creator"
                    para="Upload your outline and design pattern to create seamless ornamental designs. Perfect for custom engraving projects."
                />
            </div>
        </>
    )
}
