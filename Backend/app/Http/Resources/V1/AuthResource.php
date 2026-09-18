<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Laravel\Sanctum\NewAccessToken;

class AuthResource extends ApiResponseResource
{
    protected ?NewAccessToken $token = null;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     * @param  NewAccessToken|null  $token
     */
    public function __construct(mixed $resource, ?NewAccessToken $token = null)
    {
        parent::__construct($resource);
        $this->token = $token;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user' => UserResource::make($this->resource),
            'access_token' => $this->token?->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $this->token?->accessToken->expires_at?->toDateTimeString(),
        ];
    }
}
