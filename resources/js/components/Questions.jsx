export default function Questions({num="", ques="", para="", className}){
    return(
        <div className={`flex gap-6 py-6 ${className}`}>
            <h5 className="text-4xl font-bold px-5">{num}</h5>
            <div className="pe-4">
                <h3 className="text-2xl font-semibold">{ques}</h3>
                <p className="mt-3.5 text-lg">{para}</p>
            </div>
        </div>
    )
}