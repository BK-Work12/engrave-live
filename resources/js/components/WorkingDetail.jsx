export default function WorkingDetail({ step, title, des }) {
    return (
        <>
            <div className="bg-[#F9F9FB0D] rounded-[30px] max-w-[588px] w-full ">
                <div className="p-5">
                    <h3 className="text-5xl text-[#FEFEFE] -tracking-[2px]">{step}</h3>
                    <h4 className="sub-head mt-2.5">{title}</h4>
                    <p className="text-2xl mt-7">{des}</p>
                </div>
            </div>
        </>
    )
}