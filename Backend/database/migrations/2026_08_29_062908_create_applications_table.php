<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_post_id')->constrained('job_posts')->cascadeOnDelete();
            $table->string('cv_path');
            $table->text('cover_letter')->nullable();
            $table->string('status')->default('submitted');
            $table->timestamps();

            $table->unique(['user_id', 'job_post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
