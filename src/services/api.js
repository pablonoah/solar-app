/**
 * Green AI Solar - API Service
 * ============================
 * Service pour communiquer avec le backend FastAPI sur Render
 */

import axios from 'axios';


const RENDER_API_URL = 'https://green-ai-solar-backend.onrender.com';

// En production (GitHub Pages) → utiliser Render
// En développement → utiliser localhost
const API_BASE_URL = import.meta.env.PROD 
  ? RENDER_API_URL
  : 'http://localhost:8000';

console.log('🔗 API URL:', API_BASE_URL);
console.log('📍 Environment:', import.meta.env.PROD ? 'Production' : 'Development');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes (Render free tier peut être lent au réveil)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      throw new Error(error.response.data.detail || 'Erreur serveur');
    } else if (error.request) {
      throw new Error('Le serveur ne répond pas. Il se réveille peut-être (30s max)...');
    } else {
      throw new Error('Erreur de configuration de la requête');
    }
  }
);

/**
 * Service API Solar
 */
export const solarApi = {
  predict: async (data) => {
    const response = await api.post('/predict', data);
    return response.data;
  },

  getFeatureImportance: async () => {
    const response = await api.get('/feature-importance');
    return response.data;
  },

  getModelInfo: async () => {
    const response = await api.get('/model-info');
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

/**
 * Simulation locale (fallback si le backend n'est pas disponible)
 */
export const simulateLocally = {
  predict: (inputs) => {
    let efficiency = 0.3;
    
    // Irradiance (67% d'importance)
    efficiency += (inputs.irradiance / 1000) * 0.35;
    
    // Soiling ratio (23% d'importance)
    efficiency += inputs.soiling_ratio * 0.15;
    
    // Panel age (8% d'importance) - effet négatif
    efficiency -= (inputs.panel_age / 35) * 0.08;
    
    // Effets mineurs
    if (inputs.temperature > 25) {
      efficiency -= ((inputs.temperature - 25) / 100) * 0.03;
    }
    
    efficiency -= (inputs.humidity / 100) * 0.02;
    efficiency -= (inputs.cloud_coverage / 100) * 0.02;
    
    // Clamp
    efficiency = Math.max(0.1, Math.min(0.85, efficiency));
    
    return {
      efficiency: efficiency,
      efficiency_percent: efficiency * 100,
      quality_label: getQualityLabel(efficiency),
      confidence: 'simulated',
    };
  }
};

function getQualityLabel(efficiency) {
  if (efficiency < 0.3) return 'Faible';
  if (efficiency < 0.5) return 'Modérée';
  if (efficiency < 0.7) return 'Bonne';
  return 'Excellente';
}

export default api;
