
import { useState, useEffect } from "react";
import RangeBar from "./RangeBar";

export default function RangeBox({ svg, title, min, max, step, className, value, onChange }) {
    const [range, setRange] = useState(value ?? min);

    useEffect(() => {
        if (value !== undefined) {
            setRange(value);
        }
    }, [value]);

    const handleChange = (val) => {
        setRange(val);
        if (onChange) {
            onChange(val);
        }
    }

    return (
        <>
            <div className="mb-5">
                <div className={`${className} flex justify-between `}>
                    <div className="flex gap-2 items-center">
                        <p className="size-5">{svg}</p>
                        <h6 className="text-xs text-[#D6D6D6]">{title}</h6>
                    </div>

                    <div className="border border-[#616161] px-2 py-1">
                        <input
                            step={step}
                            type="number"
                            className="outline-none bg-transparent text-white w-16"
                            value={range}
                            min={min}
                            max={max}
                            onChange={(e) => handleChange(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="mt-2.5">
                    <RangeBar value={range} min={min} max={max} onChange={handleChange} />
                </div>
            </div>
        </>
    );
}
