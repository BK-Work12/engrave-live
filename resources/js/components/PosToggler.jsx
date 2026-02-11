import ToggleIcon from "./ToggleIcon";

export default function PosToggler({ text, className, checked, onChange }) {
    return (
        <div className={`${className} flex justify-between items-center`}>
            <span className="text-xs text-[#FFFFFF]">{text}</span>
            <ToggleIcon checked={checked} onChange={onChange} />
        </div>
    )
}