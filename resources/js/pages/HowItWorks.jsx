import Footer from "../components/Footer";
import HeroHead from "../components/HeroHead";
import NavBar from "../components/NavBar";
import WorkingDetail from "../components/WorkingDetail";
import StepsScroller from "../components/WorkingSteps";
import WorkingSteps from "../components/WorkingSteps"




export default function HowItWorks() {
    return (
        <>

            <div className="mt-15 mb-29 mx-auto text-center flex flex-col justify-center items-center relative px-4">
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                <h1 className="main-head relative max-w-[892px] -tracking-[2px]">How <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text! text-transparent!">EngraveFill Pro</span> Works</h1>
                <p className="main-p mt-7 relative max-w-[780px]">This app instantly converts your outlines into intricate scrollwork designs, ready for laser engraving, leather tooling, and more.</p>
            </div>
            <WorkingSteps />

        </>
    )
}