import ShapeCard from "./ShapeCard";

export default function Goal() {
    return (
        <>
            <div className="xl:mt-50 mt-35">
                <div className="flex flex-col lg:flex-row px-4  gap-25  justify-center items-center lg:items-start container mx-auto relative ">
                    <div className="absolute bg-[#6235FD] blur-[279.3px]  right-0 top-0 w-[248px] h-[249px]"></div>
                    <div className="z-30">
                        <ShapeCard head="From Simple Outline..." para="Provide a clean outline of your shape. It's the canvas for your masterpiece." image="/assets/emptyKnife.png" />
                    </div>
                    <div className="z-30">
                        <img src="/assets/arrow.png" alt="" className="-translate-x-[100px] hidden lg:block" />
                        <ShapeCard head="To Intricate Art..." para="Our app fills it with a unique, stunning scrollwork design in seconds." image="/assets/artKnife.png"
                            className="flex justify-end" />
                    </div>
                </div>
            </div>
        </>
    )
}