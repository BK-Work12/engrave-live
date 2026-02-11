export default function FAQDetails() {
    const faqs = [
        {
            id: "01",
            title: "What is EngraveFill Pro?",
            des: "EngraveFill Pro is an AI-powered design tool that automatically generates intricate scrollwork and other patterns to fill any shape you provide. It's perfect for laser engravers, leather artisans, and graphic designers looking to save time and create stunningly detailed artwork."
        },
        {
            id: "02",
            title: "What file formats can I upload?",
            des: "Yes, we ship worldwide with additional charges."
        },
        {
            id: "03",
            title: "Are there any size or resolution limits for uploaded images?",
            des: "Yes, we ship worldwide with additional charges."
        },
        {
            id: "04",
            title: "What kinds of shapes and outlines work best?",
            des: "Yes, we ship worldwide with additional charges."
        },
        {
            id: "05",
            title: "Can I upload a photo of my object and have the app create a scrollwork design on it?",
            des: "Yes, we ship worldwide with additional charges."
        },
        {
            id: "06",
            title: "How thick should my outline be, and should I leave a border?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "07",
            title: "Can the app fill shapes that have holes or cutouts inside them?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "08",
            title: "Can I generate a fill pattern that wraps around existing artwork inside my main shape?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "09",
            title: "Can I upload an outline of a full pistol layout and have it filled?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "10",
            title: "My generated image didn't fill the shape properly. Why?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "11",
            title: "Why didn't my first generation come out perfect? Is it normal to need multiple tries?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "12",
            title: "If I upload the same image multiple times, will I get the same pattern?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "13",
            title: "Can I create matching or mirrored designs for a pair of shapes, like left and right panels?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "14",
            title: "Can I upload my own image to be used as a style reference for the fill pattern?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "15",
            title: "What formats can I download my finished design in?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "16",
            title: "Is the downloaded PNG file ready to use directly in software like Lightburn?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "17",
            title: "Do my image credits expire?",
            des: "You can contact us via email or live chat."
        },
        {
            id: "18",
            title: "Can I use the generated designs for commercial products?",
            des: "You can contact us via email or live chat."
        }
    ];

    return (
        <>
            <div className="px-4 mt-29 mb-25">
                <div className="relative container mx-auto  border border-[#D6D6D6] rounded-[20px]">
                    <div className="blur-[279.3px] bg-[#6235FD] absolute left-0 top-1/4 w-[248px] h-[249px]"></div>
                    <div className="blur-[279.3px] bg-[#6235FD] absolute right-0 bottom-1/6 w-[248px] h-[249px]"></div>
                    {faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className="border-b border-[#D6D6D6] last:border-b-0 py-10"
                        >
                            <div className="flex gap-6 items-start relative">
                                {/* Manual ID */}
                                <p className="text-4xl font-bold text-[#F9F9FB] px-5">
                                    {faq.id}
                                </p>

                                <details className="group w-full">
                                    <summary className="cursor-pointer list-none flex justify-between pe-4 lg:pe-10 items-center">
                                        <h4 className="text-2xl font-semibold text-[#FEFEFE]">
                                            {faq.title}
                                        </h4>
                                        <span className="text-4xl font-bold bg-linear-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text! text-transparent!">
                                            <span className="group-open:hidden">+</span>
                                            <span className="hidden group-open:inline">−</span>
                                        </span>
                                    </summary>


                                    <p className="mt-3.5 text-lg max-w-[1058px]">
                                        {faq.des}
                                    </p>
                                </details>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
