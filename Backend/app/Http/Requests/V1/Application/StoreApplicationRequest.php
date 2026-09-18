<?php

namespace App\Http\Requests\V1\Application;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasRole(UserRole::EMPLOYEE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cover_letter' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
