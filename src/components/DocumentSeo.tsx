import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applyDocumentIndexing } from '../lib/seo'

export function DocumentSeo() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    applyDocumentIndexing(pathname)
  }, [pathname])
  return null
}
