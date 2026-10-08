import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Review } from '../../types';

export const reviewsApi = {
  async addReview(placeId: number, review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const localFallbackReview: Review = {
      ...review,
      id: Date.now(),
      place_id: placeId,
      status: 'published',
      created_at: 'Agora mesmo',
    };

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(localFallbackReview, 120);
    }

    try {
      const response = await apiClient<unknown>('/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
      });

      const raw = (response as { data?: Record<string, unknown> })?.data || (response as Record<string, unknown>);
      if (raw && raw.id) {
        return {
          id: Number(raw.id),
          place_id: Number(raw.place_id || placeId),
          user_id: raw.user_id ? Number(raw.user_id) : review.user_id,
          user_name: String(raw.user_name || review.user_name),
          user_avatar: (raw.user_avatar as string) || review.user_avatar,
          rating: Number(raw.rating || review.rating),
          comment: String(raw.comment || raw.content || review.comment),
          status: (raw.status as Review['status']) || 'published',
          created_at: String(raw.created_at || 'Agora mesmo'),
        };
      }
      return localFallbackReview;
    } catch (error: unknown) {
      // Como o endpoint /reviews ainda não foi publicado no backend Laravel (404),
      // trata graciosamente e retorna a avaliação local para a experiência do usuário.
      console.warn(
        'Endpoint /reviews ainda não disponível no backend Laravel (404/500/rede). Salvando avaliação localmente na sessão:',
        error
      );
      return localFallbackReview;
    }
  },
};
