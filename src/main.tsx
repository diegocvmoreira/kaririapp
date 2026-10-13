import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeGoogleConsentMode } from './services/consentService';
import { analytics } from './services/analyticsService';

// 1. Define Google Consent Mode v2 padrão negado (Privacy by Default)
initializeGoogleConsentMode();

// 2. Inicializa o serviço de Analytics
analytics.init();

createRoot(document.getElementById('root')!).render(<App />);
