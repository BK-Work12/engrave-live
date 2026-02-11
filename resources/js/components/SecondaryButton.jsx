export default function SecondaryButton({ text = "", className, onClick = () => { }, type = "submit" }) {
    return (
        <button type={type} onClick={onClick} className={`py-3 px-5 cursor-pointer whitespace-nowrap text-center bg-[#F5F5FF] rounded-lg ${className}`}>
            <span className="bg-gradient-to-r from-[#5F34FF] to-[#C459C6] bg-clip-text text-transparent font-semibold btn-text">{text}</span>
        </button>
    )
}