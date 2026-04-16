# Development Plan

## Source brief
- Main product brief lives in Main.txt
- Goal: build a NorVoch jewelry builder page that feels like a luxury storefront, not a separate app

## Milestones

### Step 1 — Foundation reset
- Verify required libraries are installed
- Remove the generic starter UI direction
- Establish the NorVoch visual system in the theme and global styles
- Build the core two-panel layout shell with a fixed header

### Step 2 — Interactive builder
- Improve anchor selection behavior
- Wire contextual catalog filtering to the selected piercing
- Add richer placement feedback and stack summary interactions

### Step 3 — Product detail and cart flow
- Add drawer or modal for product details
- Support add, replace, and remove flows more completely
- Improve cart and save-look interactions

### Step 4 — Polish and responsiveness

## Current focus
### Step 5 — Real product data integration ✓ COMPLETE
- Set up Shopify product data fetching and normalization pipeline
- Build API route to serve normalized products with cache-first strategy
- Refactor builder component to fetch real products on mount
- Update all product tracking from name-based to ID-based lookups
- Verify TypeScript compilation and data flow end-to-end
- Add logging and source diagnostics to debug live-vs-cache product behavior

## Current focus
Step 6 — Product metadata enrichment in progress

- Extract structured option metadata from Shopify tags during normalization
- Surface option metadata in the product detail modal
- Keep UI backward-compatible with older cached normalized files
- Refine gold metadata normalization: dedupe values, strip option prefixes, split karat from color/type options
- Harden parser against casing/whitespace/prefix variation to prevent duplicate semantic options

## Proposed next step after approval
## Proposed next steps
Choose the highest-priority track for continued development:
- Real checkout and cart flow integration (order processing, payment)
- Product image rendering and gallery enhancement
- Product variants and customization options (size, color, gem selection)
- Advanced filtering and discovery (material, price, collection)
- Visual polish and animation refinement
- Inventory management and real-time availability
