
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './crm-responsive.css'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Enhanced error handling and debugging
const initializeApp = async () => {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      throw new Error('Root element not found - DOM may not be ready');
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('main.tsx: Error during initialization:', error);
    
    // Enhanced fallback error display
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          background-color: #f8fafc; 
          font-family: system-ui, sans-serif;
          padding: 1rem;
        ">
          <div style="
            background: white; 
            padding: 2rem; 
            border-radius: 0.5rem; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
          ">
            <h1 style="color: #dc2626; margin-bottom: 1rem; font-size: 1.5rem;">Greška prilikom pokretanja</h1>
            <p style="color: #64748b; margin-bottom: 1rem;">Aplikacija se nije mogla pokrenuti.</p>
            <div style="background: #fee2e2; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1rem; text-align: left;">
              <strong style="color: #dc2626;">Greška:</strong>
              <pre style="color: #7f1d1d; font-size: 0.875rem; margin-top: 0.5rem; white-space: pre-wrap;">${error.message || 'Unknown error'}</pre>
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
              <button onclick="window.location.reload()" style="
                background: #3b82f6; 
                color: white; 
                border: none; 
                padding: 0.5rem 1rem; 
                border-radius: 0.25rem; 
                cursor: pointer;
                font-weight: 500;
              ">
                Osvježi stranicu
              </button>
              <button onclick="console.clear(); window.location.reload()" style="
                background: #6b7280; 
                color: white; 
                border: none; 
                padding: 0.5rem 1rem; 
                border-radius: 0.25rem; 
                cursor: pointer;
                font-weight: 500;
              ">
                Očisti konzolu i osvježi
              </button>
            </div>
            <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
              Provjerite konzolu (F12) za dodatne detalje o grešci.
            </p>
          </div>
        </div>
      `;
    }
  }
};

// Initialize with DOM ready check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
