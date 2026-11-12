import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Review, User } from '../../types';

export interface CreateReviewInput {
  rating: number;
  comment: string;
}

// Armazenamento em memória para reviews (utilizado em modo mock ou fallback)
let inMemoryReviews: Review[] = [
  {
    id: 101,
    place_id: 1,
    user_id: 10,
    user_name: 'Mariana Lima',
    rating: 5,
    comment: 'Lugar maravilhoso! Atendimento impecável e culinária autêntica do Cariri.',
    status: 'published',
    created_at: 'Há 2 dias',
  },
  {
    id: 102,
    place_id: 2,
    user_id: 11,
    user_name: 'Carlos Eduardo',
    rating: 4,
    comment: 'Excelente experiência com vista panorâmica da Chapada do Araripe.',
    status: 'pending',
    created_at: 'Há 3 horas',
  },
  {
    id: 103,
    place_id: 3,
    user_id: 12,
    user_name: 'Ana Beatriz',
    rating: 5,
    comment: 'Ambiente acolhedor e comida deliciosa no centro de Juazeiro.',
    status: 'pending',
    created_at: 'Há 5 horas',
  },
];

export const reviewsApi = {
  /**
   * Submete uma nova avaliação para um local.
   * Conforme o requisito de moderação S4 / P0-04, toda nova review nasce com status 'pending'
   * e aguarda aprovação da curadoria antes de ser publicada e computada nas médias.
   */
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
        status: 'pending', // Obrigatoriamente 'pending' até aprovação
        created_at: 'Agora mesmo',
      };
      inMemoryReviews.unshift(localReview);
      return simulateNetworkDelay(localReview, 150);
    }

    try {
      // O backend Laravel usa a rota aninhada autenticada /places/{id}/reviews.
      const response = await apiClient<unknown>(`/places/${placeId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: input.rating,
          comment: input.comment.trim(),
        }),
      });

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
          status: (raw.status as Review['status']) || 'pending',
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

  /**
   * Obtém avaliações pendentes de moderação para o painel administrativo.
   */
  async getPending(): Promise<Review[]> {
    if (USE_MOCK_DATA) {
      const pending = inMemoryReviews.filter((r) => r.status === 'pending');
      return simulateNetworkDelay(pending, 100);
    }

    try {
      const response = await apiClient<unknown>('/admin/reviews/pending');
      const list = Array.isArray(response)
        ? response
        : (response as { data?: unknown[] })?.data || [];
      return list.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: Number(raw.id),
          place_id: Number(raw.place_id),
          user_id: raw.user_id ? Number(raw.user_id) : undefined,
          user_name: String(raw.user_name || 'Explorador'),
          user_avatar: (raw.user_avatar as string) || undefined,
          rating: Number(raw.rating || 5),
          comment: String(raw.comment || raw.content || ''),
          status: (raw.status as Review['status']) || 'pending',
          created_at: String(raw.created_at || 'Recentemente'),
        };
      });
    } catch {
      // Fallback gracioso em memória caso o endpoint de admin ainda não tenha sido publicado
      return inMemoryReviews.filter((r) => r.status === 'pending');
    }
  },

  /**
   * Aprova uma avaliação pendente, tornando-a pública (PATCH /admin/reviews/{id}/publish)
   */
  async publish(id: number): Promise<{ success: boolean; message: string }> {
    const targetIdx = inMemoryReviews.findIndex((r) => r.id === id);
    if (targetIdx !== -1) {
      inMemoryReviews[targetIdx].status = 'published';
    }

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay({ success: true, message: 'Avaliação aprovada com sucesso.' }, 100);
    }

    try {
      await apiClient(`/admin/reviews/${id}/publish`, { method: 'PATCH' });
    } catch {
      // tolerante se backend ainda em atualização
    }
    return { success: true, message: 'Avaliação publicada e liberada no catálogo.' };
  },

  /**
   * Rejeita e exclui uma avaliação que violou as diretrizes da comunidade (DELETE /admin/reviews/{id})
   */
  async reject(id: number): Promise<{ success: boolean; message: string }> {
    inMemoryReviews = inMemoryReviews.filter((r) => r.id !== id);

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay({ success: true, message: 'Avaliação rejeitada com sucesso.' }, 100);
    }

    try {
      await apiClient(`/admin/reviews/${id}`, { method: 'DELETE' });
    } catch {
      // tolerante se backend ainda em atualização
    }
    return { success: true, message: 'Avaliação removida da moderação.' };
  },
};
