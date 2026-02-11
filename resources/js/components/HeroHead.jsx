export default function HeroHead({head, para, className }){
    return(
        <>
            <div className={`mt-15 mx-auto text-center relative px-4 ${className}`}>
                <div className="blur-[279.3px] bg-[#6235FD] absolute left-1/2 -translate-x-1/2 w-[366px] h-[368px] text-center"></div>
                <h1 className="main-head relative -tracking-[2px]">{head}</h1>
                <p className="main-p mt-7 relative max-w-[780px]!">{para}</p>
            </div>
        </>
    )
}