export default function SelectBox({ label, options = [], value, onChange, className }) {
    return (
        <div className={`mt-4 ${className}`}>
            <label className="text-xs text-[#D6D6D6]">{label}</label>

            <div className="mt-3 w-full border border-[#808080] rounded-sm px-2 py-2">
                <select
                    className="w-full bg-transparent text-xs text-white outline-none"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                >
                    {options.map((opt, index) => (
                        <option key={index} value={opt} className="text-black text-sm"> {/* Changed text-white to text-black for visibility in white dropdown on some systems, or stick to dark mode styles if fully governed by CSS */}
                            {opt}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
