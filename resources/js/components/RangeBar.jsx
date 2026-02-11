import { useRef, useState } from "react";

export default function RangeBar({ value, min, max, onChange }) {
  const barRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValueFromPosition = (clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    let x = clientX - rect.left;

    // Clamp
    x = Math.max(0, Math.min(x, rect.width));

    const percent = x / rect.width;
    const newValue = min + percent * (max - min);

    onChange(Number(newValue.toFixed(2)));
  };

  // Click on bar
  const handleClick = (e) => {
    updateValueFromPosition(e.clientX);
  };

  // Drag start
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Drag move
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateValueFromPosition(e.clientX);
  };

  // Drag end
  const stopDragging = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      className="relative  w-full h-[3px] bg-[#616161] rounded-xl cursor-pointer select-none"
    >
      {/* Filled track */}
      <div
        className="absolute h-[3px] rounded-xl bg-linear-to-r from-[#5F34FF] to-[#C459C6]"
        style={{ width: `${percentage}%` }}
      />

      {/* Draggable Button */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-1/2 w-5 h-3 ml-2 rounded-lg bg-linear-to-r from-[#5F34FF] to-[#C459C6] cursor-grab active:cursor-grabbing"
        style={{
          left: `${percentage}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
