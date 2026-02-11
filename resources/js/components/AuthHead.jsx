export default function AuthHead({title, description}){
    return(
        <>
            <div className="">
                <h1 className="sub-head text-[#F5F5FF]">{title}</h1>
                <p className="text-xl mt-2.5">{description}</p>
            </div>
        </>
    )
}