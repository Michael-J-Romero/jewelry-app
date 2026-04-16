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
Step 7 — Big order data consistency validation (internal-only tooling) in progress

- Security hardening pass: remove public-facing reconciliation and invoice export routes so bigOrder1 data is not web-accessible

- Build a comparator for manual invoice rows vs Shopify export rows
- Match rows by normalized title (case-insensitive and whitespace-insensitive)
- Stop assuming both datasets share index order
- Flag unmatched title rows: Item Name vs Line: Title
- Flag row-level price mismatches: Unit Cost vs Line: Price
- Run fuzzy similarity search for unresolved title mismatches
- Surface confidence scores for potential manual-to-export title links
- Reconcile duplicates by grouped totals so quantity matching is one-to-one at group level
- Use export Line: Properties (for example Angel Number) as title augmentation for matching
- Build canonical property-aware names for generic export titles like Angel Numbers, Astrological Sign, and Zodiac Constellations
- Within each matched title, pair same-price buckets first and then cross-pair remaining quantities to avoid false quantity mismatches from price-bucket split differences
- Calculate and display full dataset totals from unit price x quantity so manual vs export value can be compared at a glance
- Keep reconciliation outputs internal-only; do not expose bigOrder1 datasets via public app routes

## Proposed next step after approval
## Proposed next steps
Choose the highest-priority track for continued development:
- Continue builder-only catalog polish for no-viewer mode, sticky controls, and lower-friction product detail access
- Extend the product detail gallery with image swapping and zoom-friendly viewing for close inspection
- Evolve the new cart drawer mock into a fuller cart flow with quantities, variant summaries, and checkout handoff
- Add cart-item media quality and removal safeguards (thumbnail fidelity, destructive-action confirmations, undo patterns)
- Real checkout and cart flow integration (order processing, payment)
- Product image rendering and gallery enhancement
- Product variants and customization options (size, color, gem selection)
- Advanced filtering and discovery (material, price, collection)
- Visual polish and animation refinement
- Inventory management and real-time availability
- Data cleanup tooling for invoice/export reconciliation
