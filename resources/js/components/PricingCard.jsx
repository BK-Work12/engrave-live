import PrimaryButton from "./PrimaryButton";
import { router } from "@inertiajs/react";

export default function PricingCard({ type, pricePerPack, pricePerImage, l1, l2, l3, btnText, priceId, credits, disabled = false }) {

    const handleCheckout = () => {
        if (!disabled) {
            router.post('/checkout', {
                price_id: priceId,
                credits: credits
            });
        }
    }

    return (
        <>
            <div className="pricingCard group bg-[#171616] max-w-[286px] w-full rounded-xl h-full  py-4 flex flex-col justify-between items-center text-center ">

                <div className="border-b border-[#D6D6D6] w-full">
                    <h3 className="text-[21px] font-bold text-[#FEFEFE]">{type}</h3>
                    <p className="mt-5"><span className="text-5xl font-bold text-[#6235FD]">{pricePerPack}</span> /pack</p>
                    <p>{pricePerImage}</p>
                    <p className="text-sm  mt-5 pb-3">* Local taxes may apply.</p>
                </div>
                <div className="my-11 flex flex-col gap-2.5">
                    <p>{l1}</p>
                    <p>{l2}</p>
                    <p>{l3}</p>
                </div>
                <div className="w-full px-4.5">
                    <p>No Subscription</p>
                    <PrimaryButton text={btnText} onClick={handleCheckout} disabled={disabled} className="mt-3 w-full group-hover:bg-white group-hover:bg-none group-hover:text-[#0D0D0D]" />
                </div>
            </div>

        </>
    )
}