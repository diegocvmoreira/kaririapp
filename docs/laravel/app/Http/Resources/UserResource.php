<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'email' => (string) $this->email,
            'avatar' => $this->avatar,
            'role' => (string) ($this->role ?? 'user'),
            'status' => (string) ($this->status ?? 'active'),
            'city_preference' => $this->city_preference,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
