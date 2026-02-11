import { useState } from "react";
import { stylesData } from "../Data/stylesData";

export default function DropdownBar({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState("metal");
  const currentCategory = stylesData[activeTab];

  return (
    <div className="bg-[#171616] max-w-[289px] relative rounded-lg border border-[#2F2E2E] shadow-xl">

      {/* ❌ Close Icon */}
      <div
        className="absolute top-2 right-1.5 cursor-pointer"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M6.66699 6.66663L10.0003 9.99996M10.0003 9.99996L13.3337 13.3333M10.0003 9.99996L13.3337 6.66663M10.0003 9.99996L6.66699 13.3333"
            stroke="url(#paint0_linear_350_499)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="paint0_linear_350_499" x1="6.66699" y1="9.99996" x2="13.5461" y2="9.99996">
              <stop stopColor="#5F34FF" />
              <stop offset="1" stopColor="#C459C6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="py-5 ps-5">

        {/* 🔹 Tabs */}
        <div className="max-w-[235px] flex items-center justify-center gap-2 text-center text-xs text-[#D6D6D6] whitespace-nowrap">
          {["metal", "leather", "other"].map((tab) => (
            <h4
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={` cursor-pointer transition
                ${activeTab === tab
                  ? "text-[#FEFEFE] font-semibold bg-gradient-to-r from-[#5F34FF] to-[#C459C6] p-2.5 rounded-[10px]"
                  : "text-[#FEFEFE]"
                }`}
            >
              {stylesData[tab].label}
            </h4>
          ))}
        </div>

        {/* 🔹 Scrollable Content */}
        <div className="mt-5.5 h-[380px] overflow-y-auto custom-scroll pr-2">

          {/* METAL & LEATHER */}
          {activeTab !== "other" &&
            Object.entries(currentCategory.options).map(([key, option]) => (
              <div
                key={key}
                onClick={() => {
                  onSelect(option.text);
                  onClose && onClose();
                }}
                className="flex gap-3 mb-4 p-2 rounded hover:bg-[#1f1f1f] cursor-pointer transition"
              >
                <img
                  src={option.images[0]}
                  alt={option.text}
                  className="w-20 h-18.5 bg-white rounded object-contain"
                />
                <p className="text-xs text-[#D6D6D6] flex-1">
                  {option.text}
                </p>
              </div>
            ))}

          {/* OTHER */}
          {activeTab === "other" &&
            currentCategory.options.images.images.map((img, index) => (
              <div
                key={index}
                onClick={() => {
                  onSelect("Other");
                  onClose && onClose();
                }}
                className="mb-4 p-2 rounded hover:bg-[#1f1f1f] transition cursor-pointer"
              >
                <img
                  src={img}
                  alt="Other"
                  className="w-40 h-20 mx-auto rounded object-contain"
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
