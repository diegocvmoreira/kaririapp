import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Review } from '../../types';

export const reviewsApi = {
  async addReview(placeId: number, review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (USE_MOCK_DATA) {
      const newReview: Review = {
        ...review,
        id: Date.now(),
        place_id: placeId,
        status: 'published',
        created_at: 'Agora mesmo',
      };
      return simulateNetworkDelay(newReview, 150);
    }

    return apiClient<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },
};
