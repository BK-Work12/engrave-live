<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Design extends Model
{
    protected $fillable = ['user_id', 'name', 'file_path', 'status', 'settings'];

    protected $casts = [
        'settings' => 'array',
    ];
}
