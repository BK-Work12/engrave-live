import FindAnswers from "../components/FindAnswers";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import PricingCard from "../components/PricingCard";

export default function Pricing() {
    return (
        <>

            <div className="mt-15 mx-auto text-center relative px-4 flex flex-col justify-center items-center">
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px]"></div>
                <h3 className="main-head relative max-w-[952px] -tracking-[2px]">EngraveFill <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text! text-transparent!">Pro</span></h3>
                <p className="main-p mt-7 relative max-w-[780px]">Automatic Scrollwork Filler for Laser and Leather Art.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full px-4 place-items-center container relative  mt-29 mx-auto ">
                <PricingCard type="Starter" pricePerPack="£5*" pricePerImage="(£0.20 per image)" l1="✓25 Image Generations" l2="✓No Expiration date" btnText="Choose Starter" priceId="price_1SiiJlRFSJorPncHinlQn7nh" credits={25} disabled={true} />
                <PricingCard type="Basic" pricePerPack="€12*" pricePerImage="(€0.12 per image)" l1="✓100 Image Generations" l2="✓No Expiration date" btnText="Choose Basic" priceId="price_67890" credits={100} disabled={true} />
                <PricingCard type="Pro" pricePerPack="€20*" pricePerImage="(€0.08 per image)" l1="✓250 Image Generations" l2="✓No Expiration date" btnText="Choose Pro" priceId="price_54321" credits={250} disabled={true} />
                <PricingCard type="Premium" pricePerPack="€35*" pricePerImage="(€0.12 per image)" l1="✓100 Image Generations" l2="✓No Expiration date" l3="✓Email Support" btnText="Choose Premium" priceId="price_09876" credits={500} disabled={true} />
            </div>
            <FindAnswers />

        </>
    );
}
