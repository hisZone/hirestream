<?php

declare(strict_types=1);

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
        Schema::create('job_matches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_post_id')->constrained('job_posts')->cascadeOnDelete();
            $table->unsignedTinyInteger('match_score')->default(0);
            $table->json('match_reasons')->nullable();
            $table->boolean('is_dismissed')->default(false);
            $table->boolean('is_viewed')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'job_post_id']);
            $table->index(['user_id', 'is_dismissed', 'match_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_matches');
    }
};
