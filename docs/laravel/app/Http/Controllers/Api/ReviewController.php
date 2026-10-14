<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Place;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Lista avaliações de um local (leitura pública sem exigir autenticação).
     */
    public function index(Request $request, int $placeId): JsonResponse
    {
        $reviews = Review::query()
            ->where('place_id', $placeId)
            ->where('status', 'published')
            ->with(['user:id,name,avatar'])
            ->latest()
            ->paginate(15);

        return response()->json($reviews);
    }

    /**
     * Cadastra nova avaliação para um local.
     * Exige autenticação Sanctum e rate limiting. O autor é SEMPRE derivado de $request->user().
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $place = Place::findOrFail($validated['place_id']);

        $review = Review::create([
            'place_id'   => $place->id,
            'user_id'    => $user->id,
            'rating'     => $validated['rating'],
            'comment'    => trim($validated['comment']),
            'status'     => 'published', // ou 'pending' se houver esteira de moderação
            'ip_hash'    => hash('sha256', (string) $request->ip()),
        ]);

        // Atualiza nota média e contagem consolidada do local
        $place->recalculateRating();

        return response()->json([
            'id'          => $review->id,
            'place_id'    => $review->place_id,
            'user_id'     => $user->id,
            'user_name'   => $user->name,
            'user_avatar' => $user->avatar,
            'rating'      => $review->rating,
            'comment'     => $review->comment,
            'status'      => $review->status,
            'created_at'  => $review->created_at->diffForHumans(),
        ], 201);
    }
}
