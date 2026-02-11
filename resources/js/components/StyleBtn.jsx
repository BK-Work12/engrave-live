export default function StyleBtn({ text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-[56px] text-sm font-medium transition border border-[#FFFFFF] 
        ${
          active
            ? " bg-linear-to-r from-[#5F34FF] to-[#C459C6]  text-white border-none"
            : "bg-[#0D0D0D] text-[#D6D6D6]"
        }`}
    >
      {text}
    </button>
  );
}
