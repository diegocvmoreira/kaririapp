<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'owner_id' => $this->owner_id ? (int) $this->owner_id : null,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'short_description' => $this->short_description ?? '',
            'description' => $this->description ?? $this->short_description ?? '',
            'category_id' => (int) $this->category_id,
            'category_name' => $this->category ? $this->category->name : ($this->category_name ?? 'Geral'),
            'category_slug' => $this->category ? $this->category->slug : ($this->category_slug ?? 'gastronomia'),
            'city_id' => (int) $this->city_id,
            'city_name' => $this->city ? $this->city->name : ($this->city_name ?? 'Crato'),
            'city_slug' => $this->city ? $this->city->slug : ($this->city_slug ?? 'crato'),
            'neighborhood' => $this->neighborhood ?? '',
            'address' => $this->address ?? '',
            'zipcode' => $this->zipcode,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'coordinate_source' => $this->coordinate_source,
            'coordinate_confidence' => $this->coordinate_confidence,
            'needs_review' => (bool) $this->needs_review,
            'cover_image' => $this->cover_image ?? "/placeholders/{$this->category_slug}.svg",
            'images' => $this->relationLoaded('images')
                ? $this->images->pluck('path')->toArray()
                : ($this->images ?? []),
            'rating' => (float) $this->rating,
            'reviews_count' => (int) $this->reviews_count,
            'price_level' => (int) ($this->price_level ?? 2),
            'is_featured' => (bool) $this->is_featured,
            'verified' => (bool) $this->verified,
            'is_open_now' => (bool) $this->is_open_now,
            'opening_hours' => $this->opening_hours ?? '',
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'instagram' => $this->instagram,
            'facebook' => $this->facebook,
            'website' => $this->website,
            'status' => (string) ($this->status ?? 'published'),
            'tags' => is_array($this->tags) ? $this->tags : [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
