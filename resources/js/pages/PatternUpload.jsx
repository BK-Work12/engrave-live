import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from './Layout';

const PatternUpload = () => {
    const [file, setFile] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [validating, setValidating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [validation, setValidation] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'other',
        description: '',
        tags: '',
        is_public: false,
        price: '0.00'
    });

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                setFile(droppedFile);
                setValidation(null);
                setUploadSuccess(false);
            } else {
                alert("Please upload an image file (PNG, JPG, BMP).");
            }
        }
    }, []);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setValidation(null);
            setUploadSuccess(false);
        }
    }, []);

    const validateImage = async (endpoint) => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setValidating(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/patterns/validate/${endpoint}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const result = await response.json();
            setValidation(result);
        } catch (error) {
            alert('Validation failed: ' + error.message);
        } finally {
            setValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        if (!formData.name.trim()) {
            alert('Please enter a pattern name');
            return;
        }

        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('name', formData.name);
        uploadFormData.append('category', formData.category);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('tags', formData.tags);
        uploadFormData.append('is_public', formData.is_public ? '1' : '0');
        uploadFormData.append('price', formData.price);

        try {
            const response = await fetch('/api/patterns/upload', {
                method: 'POST',
                body: uploadFormData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const result = await response.json();
            
            if (response.ok) {
                setUploadSuccess(true);
                // Reset form
                setFile(null);
                setValidation(null);
                setFormData({
                    name: '',
                    category: 'other',
                    description: '',
                    tags: '',
                    is_public: false,
                    price: '0.00'
                });
                
                alert('Pattern uploaded successfully!');
            } else {
                alert('Upload failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Layout>
            <Head title="Upload Pattern" />
            
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-2">Upload Pattern</h1>
                    <p className="text-slate-400 mb-8">Upload your laser engraving patterns to your library and optionally sell them in the marketplace</p>

                    {/* Drag & Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer mb-6
                            ${isDragOver 
                                ? 'border-indigo-500 bg-indigo-500/10' 
                                : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                            }
                        `}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-white">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <p className="text-white font-semibold">{file.name}</p>
                                <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <>
                                <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-white text-lg font-semibold mb-2">Drop your image here</p>
                                <p className="text-slate-400 text-sm">or click to browse</p>
                                <p className="text-slate-500 text-xs mt-2">PNG, JPG, BMP (Max 10MB)</p>
                            </>
                        )}
                    </div>

                    {/* Validation Buttons */}
                    {file && !uploadSuccess && (
                        <div className="bg-slate-800 rounded-xl p-6 mb-6">
                            <h3 className="text-white text-lg font-semibold mb-4">Validate Your Image</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => validateImage('pattern')}
                                    disabled={validating}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {validating ? 'Validating...' : 'Validate as Pattern'}
                                </button>
                                <button
                                    onClick={() => validateImage('outline')}
                                    disabled={validating}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {validating ? 'Validating...' : 'Validate as Outline'}
                                </button>
                                <button
                                    onClick={() => validateImage('auto')}
                                    disabled={validating}
                                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {validating ? 'Validating...' : 'Auto-detect Type'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Validation Results */}
                    {validation && (
                        <div className={`rounded-xl p-6 mb-6 ${validation.is_valid ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                            <h3 className={`text-lg font-semibold mb-3 ${validation.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                                {validation.is_valid ? '✓ Validation Passed' : '✗ Validation Failed'}
                            </h3>
                            
                            {validation.errors && validation.errors.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-red-300 font-medium mb-2">Errors:</h4>
                                    <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                                        {validation.errors.map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {validation.warnings && validation.warnings.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-yellow-300 font-medium mb-2">Warnings:</h4>
                                    <ul className="list-disc list-inside text-yellow-200 text-sm space-y-1">
                                        {validation.warnings.map((warning, i) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {validation.metadata && (
                                <div>
                                    <h4 className="text-slate-300 font-medium mb-2">Metadata:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                                        {Object.entries(validation.metadata).map(([key, value]) => (
                                            <div key={key}>
                                                <span className="text-slate-500">{key}:</span> {JSON.stringify(value)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Form */}
                    {file && validation?.is_valid && !uploadSuccess && (
                        <div className="bg-slate-800 rounded-xl p-6">
                            <h3 className="text-white text-lg font-semibold mb-4">Pattern Details</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 mb-2">Pattern Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                                        placeholder="e.g., Celtic Knot Pattern"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="scrollwork">Scrollwork</option>
                                        <option value="leatherwork">Leatherwork</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none h-24"
                                        placeholder="Describe your pattern..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                                        placeholder="celtic, vintage, decorative"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_public}
                                        onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                                        className="w-5 h-5 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500"
                                    />
                                    <label className="text-slate-300">Make public in marketplace</label>
                                </div>

                                {formData.is_public && (
                                    <div>
                                        <label className="block text-slate-300 mb-2">Price (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                        <p className="text-slate-500 text-sm mt-1">Set to 0.00 for free patterns</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Pattern'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-white font-semibold mb-3">💡 Tips for Best Results</h3>
                        <ul className="text-slate-400 text-sm space-y-2">
                            <li>• Images must have a pure white background (#FFFFFF)</li>
                            <li>• Patterns should be detailed designs; outlines should be simple silhouettes</li>
                            <li>• Recommended size: 500-1500px on longest side</li>
                            <li>• File formats: PNG, JPG, or BMP (max 10MB)</li>
                            <li>• Ensure all outlines are completely closed with no gaps</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PatternUpload;
