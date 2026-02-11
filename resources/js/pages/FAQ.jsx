import FAQDetails from "../components/FAQDetails";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";

export default function FAQ() {
    return (
        <>

            <div className="mt-15 mx-auto text-center relative px-4 flex flex-col justify-center items-center">
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                <h3 className="main-head relative max-w-[952px] -tracking-[2px]">Frequently Asked <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text! text-transparent!">Questions</span></h3>
                <p className="main-p mt-7 relative max-w-[780px]">Have questions? We have answers... ;)</p>
            </div>
            <FAQDetails />

        </>
    )
}