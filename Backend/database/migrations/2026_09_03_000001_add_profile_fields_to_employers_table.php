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
        Schema::table('employers', function (Blueprint $table) {
            $table->string('email')->nullable()->after('company_name');
            $table->string('phone')->nullable()->after('email');
            $table->string('industry')->nullable()->after('website');
            $table->string('company_size')->nullable()->after('industry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            $table->dropColumn(['email', 'phone', 'industry', 'company_size']);
        });
    }
};
