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
            'status'     => 'pending', // Obrigatoriamente 'pending' conforme S4 / P0-04 da auditoria
            'ip_hash'    => hash('sha256', (string) $request->ip()),
        ]);

        // Nota: recalculateRating() NÃO deve ser chamado aqui; só é acionado na aprovação administrativa.

        return response()->json([
            'id'          => $review->id,
            'place_id'    => $review->place_id,
            'user_id'     => $user->id,
            'user_name'   => $user->name,
            'user_avatar' => $user->avatar,
            'rating'      => $review->rating,
            'comment'     => $review->comment,
            'status'      => $review->status,
            'message'     => 'Avaliação enviada com sucesso e aguardando aprovação da moderação.',
            'created_at'  => $review->created_at->diffForHumans(),
        ], 201);
    }

    /**
     * Lista avaliações pendentes de moderação (acesso exclusivo admin).
     */
    public function pending(): JsonResponse
    {
        $reviews = Review::query()
            ->where('status', 'pending')
            ->with(['user:id,name,avatar', 'place:id,name,slug'])
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    /**
     * Aprova e publica uma avaliação pendente (acesso exclusivo admin).
     */
    public function publish(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->update(['status' => 'published']);

        // Atualiza nota média e contagem consolidada do local somente após aprovação
        $review->place?->recalculateRating();

        return response()->json([
            'success' => true,
            'message' => 'Avaliação aprovada e publicada no catálogo com sucesso.',
        ]);
    }

    /**
     * Rejeita e exclui uma avaliação inapropriada (acesso exclusivo admin).
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $place = $review->place;
        $review->delete();

        // Se a avaliação excluída já estava publicada, recalcula a média
        if ($review->status === 'published') {
            $place?->recalculateRating();
        }

        return response()->json([
            'success' => true,
            'message' => 'Avaliação removida da plataforma com sucesso.',
        ]);
    }
}
