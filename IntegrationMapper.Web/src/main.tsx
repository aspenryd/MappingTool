import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./auth/authConfig";
import { AuthProvider } from "./auth/AuthProvider";
import './index.css'
import App from './App.tsx'

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL outside of the component tree to prevent re-initialization on re-renders
// In newer MSAL versions, verify if .initialize() is needed
// msalInstance.initialize().then(() => { ... }); -> React 18+ strict mode might cause double init if not careful.
// Standard pattern for msal-browser v3:

import { BrowserRouter } from 'react-router-dom'
// ... imports

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </MsalProvider>
  </StrictMode>,
)
