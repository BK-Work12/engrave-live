import Questions from "./Questions";

export default function FindAnswers() {
    return (
        <div className="flex flex-col lg:flex-row  gap-20 justify-center  mt-50 mb-17 container mx-auto px-4 ">
            <div className="flex flex-col justify-between  max-w-[432px] relative ">
                <div className="absolute bg-[#6235FD] blur-[279.3px] left-0 top-0 w-[350px] md:w-[404px] h-[405px] "></div>
                <h2 className="sub-head relative text-white">Find Your <span className="bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent">Answers</span> Here.</h2>
                <p className="text-xl text-[#808080] relative font-medium ">Couldn’t not find what you were looking for? Write to us at <span className="text-[#FEFEFE] font-bold">faq@engravefill.info</span> or <span className="text-[#FEFEFE] font-bold">View All</span></p>
            </div>
            <div className="border border-[#D6D6D6] rounded-[20px] max-w-[740px] relative text-white">
                <Questions className="border-b border-[#D6D6D6]" num="01" ques="What is EngraveFill Pro?" para="EngraveFill Pro is an AI-powered design tool that automatically generates intricate scrollwork and other patterns to fill any shape you provide. It's perfect for laser engravers, leather artisans, and graphic designers looking to save time and create stunningly detailed artwork." />
                <Questions className="border-b border-[#D6D6D6]" num="02" ques="What file formats can I upload?" para="We currently support PNG and JPEG formats. For the best results, upload a 1200 pixes wide (or high) PNG or JPG image in 72 DPI (max 1mb) with a clean, solid black outline on a pure white background." />
                <Questions num="03" ques="What kinds of shapes and outlines work best?" para="Simple, bold shapes with clear, continuous outlines produce the best results. Think of things like knife outlines, animal silhouettes, or simple geometric patterns. Shapes that are very thin, have many disconnected parts, or feature low-contrast outlines (e.g., grey on light grey) can be more challenging for the AI to interpret correctly." />
            </div>
        </div>
    )
}
