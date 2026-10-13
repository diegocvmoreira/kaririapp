<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessClaimResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'user_id' => (int) $this->user_id,
            'user_name' => $this->user ? $this->user->name : null,
            'user_email' => $this->user ? $this->user->email : null,
            'place_id' => (int) $this->place_id,
            'place_name' => $this->place ? $this->place->name : null,
            'message' => (string) $this->message,
            'phone' => $this->phone,
            'proof' => $this->proof,
            'status' => (string) ($this->status ?? 'pending'),
            'reviewed_by' => $this->reviewed_by ? (int) $this->reviewed_by : null,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
