export default function PrimaryButton({ text = "", className = "", onClick = () => { }, type = "submit", disabled = false }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`primaryBtn py-3 px-6 outline-none whitespace-nowrap text-center cursor-pointer bg-gradient-to-r from-[#5F34FF] to-[#C459C6] text-[#F5F5F5] rounded-lg btn-text ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {text}
        </button>
    )
}
