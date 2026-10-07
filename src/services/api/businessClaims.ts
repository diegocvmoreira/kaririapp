import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { BusinessClaim } from '../../types';

const CLAIMS_STORAGE_KEY = 'kariri_business_claims';

function getStoredClaims(): BusinessClaim[] {
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Initial mock claim for testing admin panel
  return [
    {
      id: 1,
      user_id: 1,
      user_name: 'Diego Medeiros',
      user_email: 'diegocm582@gmail.com',
      place_id: 5,
      place_name: 'Café do Engenho & Bistrô',
      phone: '(88) 98122-3344',
      message: 'Sou o sócio-proprietário do Café do Engenho no Centro do Crato e gostaria de gerenciar os horários e fotos oficiais no Kariri.app.',
      proof: 'CNPJ 12.345.678/0001-90',
      status: 'pending',
      created_at: '2026-10-06 10:30',
    },
  ];
}

function saveClaims(claims: BusinessClaim[]): void {
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch {
    // ignore
  }
}

export const businessClaimsApi = {
  async getAll(): Promise<BusinessClaim[]> {
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(getStoredClaims(), 100);
    }
    return apiClient<BusinessClaim[]>('/admin/business-claims');
  },

  async createClaim(data: Omit<BusinessClaim, 'id' | 'status' | 'created_at'>): Promise<BusinessClaim> {
    if (USE_MOCK_DATA) {
      const claims = getStoredClaims();
      const newClaim: BusinessClaim = {
        ...data,
        id: Date.now(),
        status: 'pending',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      claims.unshift(newClaim);
      saveClaims(claims);
      return simulateNetworkDelay(newClaim, 150);
    }

    return apiClient<BusinessClaim>('/business-claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: number, status: BusinessClaim['status']): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const claims = getStoredClaims();
      const index = claims.findIndex((c) => c.id === id);
      if (index !== -1) {
        claims[index].status = status;
        claims[index].reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
        saveClaims(claims);
      }
      return simulateNetworkDelay(true, 100);
    }

    await apiClient(`/admin/business-claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return true;
  },
};
