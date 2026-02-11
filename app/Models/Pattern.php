<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pattern extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'category',
        'description',
        'tags',
        'file_path',
        'thumbnail_path',
        'is_public',
        'price',
        'downloads',
        'rating',
        'rating_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_public' => 'boolean',
        'price' => 'decimal:2',
        'rating' => 'decimal:2',
        'downloads' => 'integer',
        'rating_count' => 'integer',
    ];

    protected $appends = ['file_url', 'thumbnail_url'];

    /**
     * Get the user that owns the pattern
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL for the pattern file
     */
    public function getFileUrlAttribute(): string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : '';
    }

    /**
     * Get the full URL for the thumbnail
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path ? asset('storage/' . $this->thumbnail_path) : null;
    }

    /**
     * Scope for public patterns only
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope for patterns by category
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
