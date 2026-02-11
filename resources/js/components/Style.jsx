import { useEffect, useMemo, useState } from "react";
import { stylesData } from "../Data/stylesData";
import CategoryTabs from "../components/CategoryTabs";
import StyleBtn from "../components/StyleBtn";
import ImageGrid from "../components/ImageGrid";

export default function Style() {
    const [activeCategory, setActiveCategory] = useState("metal");
    const category = stylesData[activeCategory];
    const [activeOption, setActiveOption] = useState(null);
    useEffect(() => {
        handleCategory("metal")
    }, [])
    const imagesToShow = useMemo(() => {
        if (activeOption) {
            return category.options[activeOption];
        }
        return {}
    }, [activeOption, category])
    const handleCategory = (cat) => {
        setActiveCategory(cat)
        const category = stylesData[cat];
        if (category) {
            const arr = Object.keys(category.options)
            setActiveOption(arr[0])
        }
    }
    return (
        <div className="text-white container relative ">

            {/* Categories */}
            <CategoryTabs active={activeCategory} setActive={handleCategory} />
            <div className="bg-[#171616] px-5 py-7 rounded-[30px]">
                {/* Options */}
                {category?.options && activeCategory != "other" && (

                    <div className="flex flex-wrap  gap-3.5 mx-auto mb-6">
                        {Object.entries(category?.options).map(([option, value]) => (
                            <StyleBtn
                                key={option}
                                text={value.text}
                                active={activeOption === option}
                                onClick={() => setActiveOption(option)}
                            />
                        ))}
                    </div>
                )}
                <h5 className="text-xl text-[#F2F2F7]">Works best for shapes that are not overly complex.</h5>
                {/* Images */}
                {imagesToShow?.images?.length > 0 && <ImageGrid images={imagesToShow?.images} className="" />}
            </div>
        </div>
    );
}
