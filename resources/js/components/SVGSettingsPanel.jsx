import React, { useState } from "react";

export default function SVGSettingsPanel({ settings, onChange }) {
    const [localSettings, setLocalSettings] = useState(settings || {
        stroke_width: 1.0,
        stroke_color: "#000000",
        fill_color: "#FFFFFF",
        background_color: "#FFFFFF",
        scale: 1.0,
        optimize: false
    });

    const updateSetting = (key, value) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        if (onChange) {
            onChange(newSettings);
        }
    };

    return (
        <div className="bg-[#171616] rounded-[30px] p-6 mb-6">
            <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                SVG Export Settings
            </h3>

            <div className="space-y-4">
                {/* Stroke Width */}
                <div>
                    <label className="text-sm text-white block mb-2">
                        Stroke Width: {localSettings.stroke_width}
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={localSettings.stroke_width}
                        onChange={(e) => updateSetting('stroke_width', parseFloat(e.target.value))}
                        className="w-full h-2 bg-[#2F2E2E] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                    />
                </div>

                {/* Stroke Color */}
                <div>
                    <label className="text-sm text-white block mb-2">Stroke Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={localSettings.stroke_color}
                            onChange={(e) => updateSetting('stroke_color', e.target.value)}
                            className="w-16 h-10 rounded border border-[#616161] cursor-pointer"
                        />
                        <input
                            type="text"
                            value={localSettings.stroke_color}
                            onChange={(e) => updateSetting('stroke_color', e.target.value)}
                            className="flex-1 bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-3 py-2"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                {/* Fill Color */}
                <div>
                    <label className="text-sm text-white block mb-2">Fill Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={localSettings.fill_color}
                            onChange={(e) => updateSetting('fill_color', e.target.value)}
                            className="w-16 h-10 rounded border border-[#616161] cursor-pointer"
                        />
                        <input
                            type="text"
                            value={localSettings.fill_color}
                            onChange={(e) => updateSetting('fill_color', e.target.value)}
                            className="flex-1 bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-3 py-2"
                            placeholder="#FFFFFF or 'none'"
                        />
                    </div>
                </div>

                {/* Background Color */}
                <div>
                    <label className="text-sm text-white block mb-2">Background Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={localSettings.background_color}
                            onChange={(e) => updateSetting('background_color', e.target.value)}
                            className="w-16 h-10 rounded border border-[#616161] cursor-pointer"
                        />
                        <input
                            type="text"
                            value={localSettings.background_color}
                            onChange={(e) => updateSetting('background_color', e.target.value)}
                            className="flex-1 bg-[#2F2E2E] text-white border border-[#616161] rounded-lg px-3 py-2"
                            placeholder="#FFFFFF"
                        />
                    </div>
                </div>

                {/* Scale */}
                <div>
                    <label className="text-sm text-white block mb-2">
                        Scale: {localSettings.scale}x
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={localSettings.scale}
                        onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
                        className="w-full h-2 bg-[#2F2E2E] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                    />
                </div>

                {/* Optimize */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="optimize"
                        checked={localSettings.optimize}
                        onChange={(e) => updateSetting('optimize', e.target.checked)}
                        className="w-5 h-5 rounded accent-[#6366f1] cursor-pointer"
                    />
                    <label htmlFor="optimize" className="text-sm text-white cursor-pointer">
                        Optimize SVG (remove whitespace, compress)
                    </label>
                </div>
            </div>
        </div>
    );
}
