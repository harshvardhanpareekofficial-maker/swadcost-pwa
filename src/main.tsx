import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App'
import { purgeIdleLocalNow, purgeIdleOnLoad } from './lib/idleAccounts'
import { OWNER_PATH } from './lib/owner'
import { applyDocumentIndexing } from './lib/seo'
import { OwnerVaultPage } from './pages/OwnerVaultPage'

purgeIdleLocalNow()
void purgeIdleOnLoad()
applyDocumentIndexing(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={OWNER_PATH} element={<OwnerVaultPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
