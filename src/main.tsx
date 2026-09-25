import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/archivo'
import './index.css'
import './pwa'
import { flushPending } from './lib/pendingSync'
import App from './App'
import { DocumentSeo } from './components/DocumentSeo'
import { purgeIdleLocalNow, purgeIdleOnLoad } from './lib/idleAccounts'
import { OWNER_PATH } from './lib/owner'
import { applyDocumentIndexing } from './lib/seo'
import { GuidePage } from './pages/GuidePage'
import { OwnerVaultPage } from './pages/OwnerVaultPage'

purgeIdleLocalNow()
void purgeIdleOnLoad()
applyDocumentIndexing(window.location.pathname)
void flushPending()
window.addEventListener('online',()=>void flushPending())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DocumentSeo />
      <Routes>
        <Route path={OWNER_PATH} element={<OwnerVaultPage />} />
        <Route path="/guides/:slug" element={<GuidePage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
