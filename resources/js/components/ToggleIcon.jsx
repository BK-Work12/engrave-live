import { useState } from "react";

export default function ToggleIcon({ checked, onChange }) {
    const [internalState, setInternalState] = useState(false);

    const isControlled = checked !== undefined;
    const isOn = isControlled ? checked : internalState;

    const handleClick = () => {
        if (onChange) {
            onChange(!isOn);
        }
        if (!isControlled) {
            setInternalState(!isOn);
        }
    };

    return (
        <div
            className={`w-[42px] h-[22px] flex items-center rounded-3xl p-1 cursor-pointer transition-colors duration-300 ${isOn ? "bg-gradient-to-r from-[#5F34FF] to-[#C459C6]" : "bg-[#2F2E2E]"
                }`}
            onClick={handleClick}
        >
            <div
                className={`bg-[#D6D6D6] h-4 w-4 rounded-full shadow-md transform duration-300 ease-in-out ${isOn ? "translate-x-4.5" : "translate-x-0"
                    }`}
            ></div>
        </div>
    );
}
