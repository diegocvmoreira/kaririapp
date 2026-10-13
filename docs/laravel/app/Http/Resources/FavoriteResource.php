<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavoriteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'user_id' => (int) $this->user_id,
            'place_id' => $this->place_id ? (int) $this->place_id : null,
            'event_id' => $this->event_id ? (int) $this->event_id : null,
            'place' => $this->whenLoaded('place', fn() => new PlaceResource($this->place)),
            'event' => $this->whenLoaded('event', fn() => new EventResource($this->event)),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
