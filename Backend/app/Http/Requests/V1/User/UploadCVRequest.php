<?php

namespace App\Http\Requests\V1\User;

use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadCVRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasRole(UserRole::EMPLOYEE);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cv' => ['required', 'file', 'mimes:pdf', 'max:2048'], // Max size 2MB
        ];
    }

    public function messages(): array
    {
        return [
            'cv.required' => 'Please upload your CV.',
            'cv.mimes' => 'CV must be a PDF file',
            'cv.max' => 'CV must be less than 2MB',
        ];
    }
}
