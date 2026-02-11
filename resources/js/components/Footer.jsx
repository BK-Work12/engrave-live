import FooterNav from "./FooterNav";
import Newsletter from "./Newsletter";
import PromotionBox from "./PromotionBox";

export default function Footer({className}) {
    return (
        <>
            <div className="px-4 ">
                <PromotionBox className={`translate-y-1/8 lg:translate-y-1/4 z-20 relative  ${className}`} />
            </div>
            <div className="bg-[#171616] pb-5 relative overflow-hidden ">

                <div className="absolute bg-[#6235FD] blur-[279.3px] translate-1/2 right-0 bottom-0 w-[404px] h-[404px]"></div>
                <div className="container mx-auto pt-30">
                    <Newsletter />
                    <FooterNav />

                </div>
            </div>
        </>
    )
}