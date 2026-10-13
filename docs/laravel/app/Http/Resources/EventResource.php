<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $startDateStr = $this->start_date ? \Carbon\Carbon::parse($this->start_date)->format('Y-m-d') : '';
        $displayDate = $this->start_date ? \Carbon\Carbon::parse($this->start_date)->translatedFormat('d \d\e F') : '';

        return [
            'id' => (int) $this->id,
            'place_id' => $this->place_id ? (int) $this->place_id : null,
            'city_id' => (int) $this->city_id,
            'category_id' => (int) $this->category_id,
            'title' => (string) $this->title,
            'slug' => (string) $this->slug,
            'description' => (string) ($this->description ?? ''),
            'cover_image' => (string) ($this->cover_image ?? '/placeholders/eventos.svg'),
            'start_date' => $startDateStr,
            'end_date' => $this->end_date ? \Carbon\Carbon::parse($this->end_date)->format('Y-m-d') : null,
            'display_date' => $displayDate,
            'start_time' => (string) ($this->start_time ?? '19:00'),
            'end_time' => $this->end_time ? (string) $this->end_time : null,
            'place_name' => $this->place ? $this->place->name : ($this->place_name ?? ''),
            'city_name' => $this->city ? $this->city->name : ($this->city_name ?? 'Crato'),
            'city_slug' => $this->city ? $this->city->slug : ($this->city_slug ?? 'crato'),
            'address' => (string) ($this->address ?? ''),
            'price_text' => $this->is_free ? 'Gratuito' : ($this->price ? "R$ " . number_format($this->price, 2, ',', '.') : 'Sob consulta'),
            'price' => $this->price !== null ? (float) $this->price : null,
            'is_free' => (bool) $this->is_free,
            'ticket_url' => $this->ticket_url,
            'organizer' => $this->organizer,
            'category' => $this->category ? $this->category->name : ($this->category_name ?? 'Cultura & Arte'),
            'is_featured' => (bool) $this->is_featured,
            'status' => (string) ($this->status ?? 'published'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
