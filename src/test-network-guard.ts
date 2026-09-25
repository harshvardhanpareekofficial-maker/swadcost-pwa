import { beforeEach, vi } from 'vitest'
// Unit fixtures must never write to the live account or analytics service.
beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Unit-test network access is disabled'))))
