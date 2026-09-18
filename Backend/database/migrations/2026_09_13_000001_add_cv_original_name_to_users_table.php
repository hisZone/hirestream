<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'cv_original_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('cv_original_name')->nullable()->after('cv_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'cv_original_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('cv_original_name');
            });
        }
    }
};
