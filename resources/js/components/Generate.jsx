
import { useState } from "react";
import Entries from "./Entries";
import DropdownBar from "./DropdownBar";
import PrimaryButton from "./PrimaryButton";
import SelectBox from "./SelectBox";
import PosToggler from "./PosToggler";
import { stylesData, patternIntricacyOptions, patternDirectionOptions, tokens } from "../Data/stylesData";

export default function Generate({ className, onGenerate }) {

    // 🔹 Tab state: "customize" or "gallery"
    const [activeTab, setActiveTab] = useState("customize");

    // 🔹 dropdown open / close
    const [openDropdown, setOpenDropdown] = useState(false);

    // 🔹 Active selections
    const [intricacy, setIntricacy] = useState(patternIntricacyOptions[2]); // Default 'Standard'
    const [direction, setDirection] = useState(patternDirectionOptions[0]); // Default 'None'
    const [token, setToken] = useState(tokens[0]);

    // 🔹 default selected style
    const defaultText = Object.values(stylesData.metal.options)[0].text;
    const [selectedStyle, setSelectedStyle] = useState(defaultText);

    // 🔹 Offset Border State
    const [offsetBorder, setOffsetBorder] = useState(false);

    const handleSelect = (text) => {
        setSelectedStyle(text);
        setOpenDropdown(false);
    };

    return (
        <div className={`relative flex flex-col justify-between  bg-[#171616] rounded-[30px] px-4 pt-3 pb-5 mx-auto   max-w-[350px] lg:max-w-[307px]  ${className}`}>

            <div>
                {/* Tabs */}
                <div className="bg-[#0D0D0D] rounded-2xl flex">
                    <div
                        className={`py-1 font-semibold w-1/2 text-center cursor-pointer ${activeTab === "customize"
                            ? "bg-gradient-to-r from-[#5F34FF] to-[#C459C6] text-white rounded-2xl"
                            : "text-[#D6D6D6]"
                            }`}
                        onClick={() => setActiveTab("customize")}
                    >
                        Customize
                    </div>
                    <div
                        className={`py-1 font-semibold w-1/2 text-center cursor-pointer ${activeTab === "gallery"
                            ? "bg-gradient-to-r from-[#5F34FF] to-[#C459C6] text-white rounded-2xl"
                            : "text-[#D6D6D6]"
                            }`}
                        onClick={() => setActiveTab("gallery")}
                    >
                        Gallery
                    </div>
                </div>

                {/* Content */}
                {activeTab === "customize" && (
                    <div className="mt-2 relative">

                        <Entries
                            label="Style"
                            option={selectedStyle}
                            onClick={() => setOpenDropdown(!openDropdown)}
                        />

                        <SelectBox
                            label="Pattern Intricacy"
                            options={patternIntricacyOptions}
                            value={intricacy}
                            onChange={setIntricacy}
                        />

                        <SelectBox
                            label="Pattern Symmetry"
                            options={patternDirectionOptions}
                            value={direction}
                            onChange={setDirection}
                        />

                        {openDropdown && (
                            <div className="absolute top-18 lg:top-0 lg:left-full ml-6 w-full z-50">
                                <DropdownBar
                                    activeCategory="metal"
                                    onSelect={handleSelect}
                                    onClose={() => setOpenDropdown(false)}
                                />
                            </div>
                        )}

                        {/* Offset Border */}
                        <div className="mt-5.5 w-full">
                            <label className="text-xs text-[#D6D6D6]">Offset Border</label>
                            <PosToggler
                                text="Enabled"
                                checked={offsetBorder}
                                onChange={setOffsetBorder}
                            />
                        </div>

                        <SelectBox
                            className="mt-7"
                            label=""
                            options={tokens}
                            value={token}
                            onChange={setToken}
                        />

                    </div>
                )}
            </div>
            {activeTab === "customize" && (
                <PrimaryButton
                    text="Generate"
                    className="w-full"
                    onClick={() => onGenerate({
                        selectedStyle,
                        intricacy,
                        direction,
                        offsetBorder,
                        token
                    })}
                />
            )}
        </div>
    );
}

