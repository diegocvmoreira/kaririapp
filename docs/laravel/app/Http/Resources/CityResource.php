<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'state' => (string) ($this->state ?? 'CE'),
            'country' => (string) ($this->country ?? 'Brasil'),
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'image' => $this->image,
            'status' => $this->status ?? ($this->is_active ? 'active' : 'inactive'),
            'is_active' => (bool) ($this->is_active ?? true),
            'is_cariri_region' => (bool) ($this->is_cariri_region ?? false),
            'places_count' => $this->whenCounted('places'),
            'events_count' => $this->whenCounted('events'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
