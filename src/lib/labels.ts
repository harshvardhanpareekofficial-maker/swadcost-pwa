/** User-visible copy for the dalal / broker line. Internal keys stay fabricName / pickRate / jobCost. */

/** Free-text identifier on the home mill sheet (was “Fabric / job name”). */
export const DALAL_NAME_LABEL = 'Dalal name / Broker name'

/** Numeric majuri field — stored in paise per pick; jobCost ₹ = Pick × (paise ÷ 100). */
export const PICK_RATE_LABEL = 'Majuri / Pick rate / Dalal rate'

export const PICK_RATE_UNIT = 'paise per pick'

export const PICK_RATE_HINT =
  'Enter paise, not rupees — 12 means ₹0.12. Dalal line = Pick × (this ÷ 100).'

export const DALAL_SECTION_LABEL = 'Dalal / Broker & other'

export const DALAL_COST_LINE_LABEL = 'Dalal / Broker (pick × majuri paise ÷ 100)'
