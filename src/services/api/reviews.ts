import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Review } from '../../types';

export const reviewsApi = {
  async addReview(placeId: number, review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (USE_MOCK_DATA) {
      const localReview: Review = {
        ...review,
        id: Date.now(),
        place_id: placeId,
        status: 'published',
        created_at: 'Agora mesmo',
      };
      return simulateNetworkDelay(localReview, 120);
    }

    const response = await apiClient<unknown>('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        place_id: placeId,
        rating: review.rating,
        comment: review.comment,
      }),
    });

    const raw = (response as { data?: Record<string, unknown> })?.data || (response as Record<string, unknown>);
    if (raw && (raw.id || raw.comment)) {
      return {
        id: Number(raw.id || Date.now()),
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

    throw new ApiError(500, 'Resposta inválida ao cadastrar avaliação.', raw, '/reviews');
  },
};
