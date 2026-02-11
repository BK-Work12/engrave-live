export default function StepsCard({ head = "", StepName = "", para = "", image, className }) {
    return (
        <div className="bg-[#171616] rounded-[30px]">
            <div className={`card-inner flex flex-col gap-8 items-center justify-center px-4.5 pt-4.5 pb-9`}>
                <h3>{head}</h3>
                <div className="p-11 bg-[#0D0D0D] rounded-full">
                    <img src={image} alt="" />
                </div>
                <div className="text-center">
                    <h4 className="font-semibold text-[#FEFEFE] text-3xl">{StepName}</h4>
                    <p className="text-xl mt-2.5">{para}</p>
                </div>
            </div>
        </div>
    )
}