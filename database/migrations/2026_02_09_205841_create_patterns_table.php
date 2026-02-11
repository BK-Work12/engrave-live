<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patterns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('category', ['scrollwork', 'leatherwork', 'other'])->default('other');
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->boolean('is_public')->default(false);
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('downloads')->default(0);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('category');
            $table->index('is_public');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patterns');
    }
};
