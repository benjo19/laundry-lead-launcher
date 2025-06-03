
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting application initialization');

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('main.tsx: Root element found, creating React root');
  const root = createRoot(rootElement);
  
  console.log('main.tsx: Rendering App component');
  root.render(<App />);
  
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error during initialization:', error);
  
  // Fallback error display
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
          max-width: 400px;
          text-align: center;
        ">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Greška prilikom pokretanja</h1>
          <p style="color: #64748b; margin-bottom: 1rem;">Aplikacija se nije mogla pokrenuti.</p>
          <button onclick="window.location.reload()" style="
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 0.25rem; 
            cursor: pointer;
          ">
            Osvježi stranicu
          </button>
        </div>
      </div>
    `;
  }
}
