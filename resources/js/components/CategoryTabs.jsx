export default function CategoryTabs({ active, setActive }) {
  const tabs = [
    { key: "metal", label: "Metal Engraving" },
    { key: "leather", label: "Leatherwork" },
    { key: "other", label: "Other" },
  ];

  return (
    <div className="flex gap-4 ps-10">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActive(tab.key)}
          className={`px-4.5 py-3 rounded-t-[20px] text-xl font-semibold
            ${
              active === tab.key
                ? "bg-[#171616] text-white "
                : " text-[#AEAEB2]"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
