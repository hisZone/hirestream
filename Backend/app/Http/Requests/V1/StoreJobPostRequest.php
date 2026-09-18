<?php

declare(strict_types=1);

namespace App\Http\Requests\V1;

use App\Enums\ExperienceLevel;
use App\Enums\JobType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobPostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10'],
            'requirements' => ['nullable'],
            'responsibilities' => ['nullable'],
            'job_type' => ['required', 'string', Rule::in(JobType::values())],
            'experience_level' => ['required', 'string', Rule::in(ExperienceLevel::values())],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0'],
            'salary_currency' => ['nullable', 'string', 'max:10'],
            'is_remote' => ['nullable', 'boolean'],
            'submit_now' => ['nullable', 'boolean'],
        ];
    }
}
