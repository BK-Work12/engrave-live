import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Style from "../components/Style"

export default function StyleExamples() {
    return (
        <>

            <div className="mt-15 mx-auto text-center relative px-4 flex flex-col justify-center items-center">
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                <h3 className="main-head relative max-w-[849px] -tracking-[2px]">Engraving & Leatherwork<span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text! text-transparent!"> Styles</span></h3>
                <p className="main-p mt-7 relative max-w-[780px] ">Explore the variety of scrollwork, patterns, and tooling EngraveFill Pro can generate.</p>
            </div>
            <div className="mt-19 mx-auto flex justify-center mb-7">
                <Style />
            </div>

        </>
    )
}