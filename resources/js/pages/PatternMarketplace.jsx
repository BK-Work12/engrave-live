import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Layout from './Layout';

const PatternMarketplace = () => {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPatterns();
    }, [selectedCategory]);

    const fetchPatterns = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }
            
            const response = await fetch(`/api/marketplace/patterns?${params}`);
            const data = await response.json();
            setPatterns(data.patterns || []);
        } catch (error) {
            console.error('Failed to fetch patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (patternId) => {
        try {
            const response = await fetch(`/api/patterns/${patternId}/download`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pattern_${patternId}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                // Refresh to update download count
                fetchPatterns();
            } else {
                alert('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed');
        }
    };

    const handleRate = async (patternId, rating) => {
        try {
            const response = await fetch(`/api/patterns/${patternId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ rating })
            });
            
            if (response.ok) {
                fetchPatterns();
                alert('Rating submitted!');
            } else {
                alert('Failed to submit rating');
            }
        } catch (error) {
            console.error('Rating error:', error);
        }
    };

    const filteredPatterns = patterns.filter(pattern => 
        pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Layout>
            <Head title="Pattern Marketplace" />
            
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-white mb-4">Pattern Marketplace</h1>
                        <p className="text-slate-400 text-lg">Browse and download laser engraving patterns from the community</p>
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-8 space-y-4">
                        <div className="max-w-2xl mx-auto">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search patterns..."
                                className="w-full px-6 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-center gap-3 flex-wrap">
                            {['all', 'scrollwork', 'leatherwork', 'other'].map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-6 py-2 rounded-lg font-medium transition ${
                                        selectedCategory === category
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            <p className="text-slate-400 mt-4">Loading patterns...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredPatterns.length === 0 && (
                        <div className="text-center py-20">
                            <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-xl text-slate-400 mb-2">No patterns found</h3>
                            <p className="text-slate-500">Try adjusting your search or filters</p>
                        </div>
                    )}

                    {/* Pattern Grid */}
                    {!loading && filteredPatterns.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPatterns.map((pattern) => (
                                <div key={pattern.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition group">
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-slate-700 relative overflow-hidden">
                                        {pattern.thumbnail_url ? (
                                            <img 
                                                src={pattern.thumbnail_url} 
                                                alt={pattern.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-20 h-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        {/* Price Badge */}
                                        {pattern.price > 0 && (
                                            <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                                ${pattern.price}
                                            </div>
                                        )}
                                        {pattern.price === 0 && (
                                            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                                FREE
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="text-white font-semibold text-lg mb-1 truncate">{pattern.name}</h3>
                                        <p className="text-slate-400 text-sm mb-2 capitalize">{pattern.category}</p>
                                        
                                        {pattern.description && (
                                            <p className="text-slate-500 text-sm mb-3 line-clamp-2">{pattern.description}</p>
                                        )}

                                        {/* Tags */}
                                        {pattern.tags && pattern.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {pattern.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center justify-between mb-3 text-sm">
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span>{pattern.rating?.toFixed(1) || '0.0'}</span>
                                                <span className="text-slate-500">({pattern.rating_count || 0})</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                <span>{pattern.downloads || 0}</span>
                                            </div>
                                        </div>

                                        {/* Download Button */}
                                        <button
                                            onClick={() => handleDownload(pattern.id)}
                                            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition"
                                        >
                                            {pattern.price > 0 ? `Buy $${pattern.price}` : 'Download Free'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PatternMarketplace;
