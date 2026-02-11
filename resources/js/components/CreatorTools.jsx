import PrimaryButton from "./PrimaryButton";

export default function CreatorTools({ head, para, image, onClick, className, btnText }) {

    return (
        <>
            <div className={`bg-[#171616] max-w-[1007px] rounded-[30px]  ${className}`}>
                <div className="flex flex-col lg:flex-row gap-11.5 px-4 pt-7 pb-4">
                    <img src={image} alt="" className="w-[335px] sm:w-auto mx-auto" />
                    <div className="flex flex-col justify-between">
                        <div className="text-center lg:text-start">
                            <h3 className="card-head">{head}</h3>
                            <p className="main-p mt-2.5">{para}</p>
                        </div>
                        <div className="flex justify-end  mt-10">
                            <PrimaryButton text={btnText} className="w-1/2" onClick={onClick} />
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}