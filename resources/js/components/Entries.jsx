
export default function Entries({ label, option, onClick }) {
  return (
    <div className="mt-4">
      <label className="text-xs text-[#D6D6D6]">{label}</label>

      <button
        onClick={onClick}
        className="mt-3 w-full flex justify-between items-center py-2 px-2.5 border border-[#808080] rounded-sm bg-transparent cursor-pointer"
      >
        <span className="text-xs text-[#FFFFFF]">{option}</span>

        {/* Dropdown SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="4" viewBox="0 0 7 4">
          <path
            d="M2.807 3.373L0.13 0.696C0.04 0.61 0 0.51 0 0.41C0 0.2 0.18 0 0.404 0H6.081C6.305 0 6.484 0.2 6.484 0.412L3.677 3.373C3.54 3.51 3.29 3.51 3.242 3.51Z"
            fill="#808080"
          />
        </svg>
      </button>
    </div>
  );
}
