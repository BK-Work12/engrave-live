export default function ShapeCard({head="", para ="", image, className}){
    return(
        <>
            <div className={`bg-[#171616] max-w-[530px]  rounded-[30px] z-30 ${className}`}>
                
                <div className="pt-7 px-4 pb-4">
                    <h3 className="card-head">{head}</h3>
                    <p className="text-2xl mt-2.5">{para}</p>
                    <img src={image} alt="Empty Knife" className="mt-11.5"/>
                </div>
            </div>
        </>
    )
}