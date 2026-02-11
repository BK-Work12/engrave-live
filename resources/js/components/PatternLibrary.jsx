import React, { useState, useEffect } from "react";

export default function PatternLibrary({ onSelectPattern, selectedPatternId = null }) {
    const [libraries, setLibraries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState("scrollwork");
    const [uploadName, setUploadName] = useState("");

    const API_BASE = '/api';

    useEffect(() => {
        loadLibraries();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadPatterns(selectedCategory);
        }
    }, [selectedCategory]);

    const loadLibraries = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/pattern-library/list?user_id=default`);
            const data = await response.json();
            if (data.success) {
                setLibraries(data.libraries);
                if (data.libraries.length > 0 && !selectedCategory) {
                    setSelectedCategory(data.libraries[0].category);
                }
            }
        } catch (error) {
            console.error("Error loading libraries:", error);
        }
    };

    const loadPatterns = async (category) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/pattern-library/list/${category}?user_id=default`);
            const data = await response.json();
            if (data.success) {
                setPatterns(data.patterns);
            }
        } catch (error) {
            console.error("Error loading patterns:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            alert("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('category', uploadCategory);
        if (uploadName) {
            formData.append('name', uploadName);
        }

        try {
            const response = await fetch(`${API_BASE}/api/pattern-library/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                alert("Pattern uploaded successfully!");
                setShowUpload(false);
                setUploadFile(null);
                setUploadName("");
                loadPatterns(uploadCategory);
            } else {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed. Please try again.");
        }
    };

    return (
        <div className="bg-[#171616] rounded-[30px] p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-white font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                    Pattern Library
                </h3>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg text-sm"
                >
                    {showUpload ? "Cancel" : "+ Upload Pattern"}
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <div className="mb-4 p-4 bg-[#2F2E2E] rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Upload Custom Pattern</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-[#808080] block mb-1">Category</label>
                            <select
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value)}
                                className="w-full bg-[#171616] text-white border border-[#616161] rounded-lg px-3 py-2"
                            >
                                <option value="scrollwork">Scrollwork</option>
                                <option value="leatherwork">Leatherwork</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-[#808080] block mb-1">Pattern Name (Optional)</label>
                            <input
                                type="text"
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                                placeholder="My Custom Pattern"
                                className="w-full bg-[#171616] text-white border border-[#616161] rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-[#808080] block mb-1">Pattern File</label>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={(e) => setUploadFile(e.target.files?.[0])}
                                className="w-full bg-[#171616] text-white border border-[#616161] rounded-lg px-3 py-2"
                            />
                        </div>
                        <button
                            onClick={handleUpload}
                            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg"
                        >
                            Upload
                        </button>
                    </div>
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {libraries.map((lib) => (
                    <button
                        key={lib.id}
                        onClick={() => setSelectedCategory(lib.category)}
                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                            selectedCategory === lib.category
                                ? "bg-[#6366f1] text-white"
                                : "bg-[#2F2E2E] text-[#808080] hover:bg-[#3F3E3E]"
                        }`}
                    >
                        {lib.name} ({lib.pattern_count})
                    </button>
                ))}
            </div>

            {/* Pattern Grid */}
            {loading ? (
                <div className="text-center py-8 text-[#808080]">Loading patterns...</div>
            ) : patterns.length === 0 ? (
                <div className="text-center py-8 text-[#808080]">
                    No patterns found in this category. Upload one to get started!
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {patterns.map((pattern) => (
                        <div
                            key={pattern.id}
                            onClick={() => onSelectPattern(pattern)}
                            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedPatternId === pattern.id
                                    ? "border-[#6366f1] ring-2 ring-[#6366f1]"
                                    : "border-[#616161] hover:border-[#808080]"
                            }`}
                        >
                            {pattern.thumbnail ? (
                                <img
                                    src={pattern.thumbnail}
                                    alt={pattern.name}
                                    className="w-full h-32 object-cover bg-white"
                                />
                            ) : (
                                <div className="w-full h-32 bg-[#2F2E2E] flex items-center justify-center">
                                    <span className="text-[#808080] text-xs">{pattern.name}</span>
                                </div>
                            )}
                            <div className="p-2 bg-[#2F2E2E]">
                                <p className="text-xs text-white truncate">{pattern.name}</p>
                                <p className="text-xs text-[#808080]">{pattern.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
