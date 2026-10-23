import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Review, User } from '../../types';

export interface CreateReviewInput {
  rating: number;
  comment: string;
}

export const reviewsApi = {
  async addReview(placeId: number, input: CreateReviewInput): Promise<Review> {
    if (input.comment.trim().length < 10) {
      throw new ApiError(
        422,
        'O comentário deve ter no mínimo 10 caracteres para enriquecer a comunidade.',
        { comment: ['Mínimo 10 caracteres'] },
        '/reviews'
      );
    }

    if (USE_MOCK_DATA) {
      let currentUser: User | null = null;
      try {
        const stored = localStorage.getItem('kariri_user_profile');
        if (stored) currentUser = JSON.parse(stored);
      } catch {
        // ignore
      }

      const localReview: Review = {
        id: Date.now(),
        place_id: placeId,
        user_id: currentUser?.id,
        user_name: currentUser?.name || 'Explorador do Cariri',
        user_avatar: currentUser?.avatar,
        rating: input.rating,
        comment: input.comment.trim(),
        status: 'published',
        created_at: 'Agora mesmo',
      };
      return simulateNetworkDelay(localReview, 150);
    }

    try {
      // O backend oficial Laravel utiliza POST /reviews com payload { place_id, rating, comment }
      let response: unknown;
      try {
        response = await apiClient<unknown>('/reviews', {
          method: 'POST',
          body: JSON.stringify({
            place_id: placeId,
            rating: input.rating,
            comment: input.comment.trim(),
          }),
        });
      } catch (postErr: unknown) {
        if (postErr instanceof ApiError && (postErr.status === 404 || postErr.status === 405)) {
          // Fallback para rota aninhada antiga /places/{id}/reviews caso legado
          response = await apiClient<unknown>(`/places/${placeId}/reviews`, {
            method: 'POST',
            body: JSON.stringify({
              rating: input.rating,
              comment: input.comment.trim(),
            }),
          });
        } else {
          throw postErr;
        }
      }

      const raw = (response as { data?: Record<string, unknown> })?.data || (response as Record<string, unknown>);
      if (raw && (raw.id || raw.comment)) {
        return {
          id: Number(raw.id || Date.now()),
          place_id: Number(raw.place_id || placeId),
          user_id: raw.user_id ? Number(raw.user_id) : undefined,
          user_name: String(raw.user_name || 'Explorador do Cariri'),
          user_avatar: (raw.user_avatar as string) || undefined,
          rating: Number(raw.rating || input.rating),
          comment: String(raw.comment || raw.content || input.comment),
          status: (raw.status as Review['status']) || 'published',
          created_at: String(raw.created_at || 'Agora mesmo'),
        };
      }

      throw new ApiError(500, 'Resposta inválida ao cadastrar avaliação.', raw, '/reviews');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          throw new ApiError(
            401,
            'Sua sessão expirou. Por favor, entre na sua conta para publicar a avaliação.',
            err.data,
            '/reviews'
          );
        }
        if (err.status === 409) {
          throw new ApiError(409, 'Você já avaliou este local.', err.data, '/reviews');
        }
        if (err.status === 429) {
          throw new ApiError(
            429,
            'Muitas avaliações em curto período. Por favor, aguarde alguns instantes.',
            err.data,
            '/reviews'
          );
        }
        if (err.status === 422) {
          const errorsObj = (err.data as { errors?: Record<string, string[]> })?.errors;
          if (errorsObj) {
            const formatted = Object.values(errorsObj).flat().join('. ');
            throw new ApiError(422, formatted, err.data, '/reviews');
          }
        }
      }
      throw err;
    }
  },
};
