import StepsCard from "./StepsCard";

export default function Steps(){
    return(
        <div className="mt-50 container mx-auto relative px-4">
            <div className="absolute bg-[#6235FD] blur-[279.3px] left-0 top-0 w-[248px] h-[249px] "></div>
            <h2 className="sub-head text-center relative">Your Masterpiece in 3 <span className="bg-gradient-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent">Simple Steps</span></h2>
            <p className="main-p mt-5 text-center  relative">Upload, Choose and Generate</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 relative">
                <StepsCard head="1st Step" StepName="Upload Outline" para="Start with a clean PNG or JPEG outline of your shape on a solid background."
                 image="/assets/update-icon.svg" className=""/>
                 <StepsCard head="2nd Step" StepName="Choose Style" para="From dozens of engraving and leatherwork styles to match your vision."
                 image="/assets/choose-icon.svg"/>
                 <StepsCard head="3rd Step" StepName="Generate & Download" para="Let the app work its magic, then download your amazing design."
                 image="/assets/generate-icon.svg"/>
            </div>
        </div>
    )
}