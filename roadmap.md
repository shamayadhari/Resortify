# Resortify roadmap

- [x] Phase 1: public pages, sign-up and sign-in for every role, dashboard, profile
- [x] Phase 2: item reporting with photos, keyword classification, next-life recommendations
- [x] Phase 3: recycling map (geo search), pickups with live status, recurring pickups
- [x] Phase 4: marketplace and offers, fair price and weight, dealer rates, recycler desk and certificates
- [x] Phase 5: QR lifecycle tracking, NGO needs and donations, organisation drives and reports
- [x] Phase 6: rewards, community, built-in assistant, impact and platform analytics
- [x] Phase 7: security hardening, tests (backend, frontend), performance, deployment files

## Known limits (deliberate, and worth knowing)

- The category suggestion reads the **words** a person types, not the photo's pixels. `backend/src/lib/classify.js` is the single place to plug in a vision model.
- The assistant is a searchable built-in guide (`backend/src/lib/knowledge.js`), not a language model.
- Prices and CO2 figures are indicative estimates from `backend/src/lib/catalog.js`; they are labelled as such everywhere in the interface.
- There is no email or SMS, so no password reset and no push notifications. Pickup and donation status is refreshed by polling every 8-20 seconds while a page is open.
- Scope is electronics (e-waste). Household wet/dry waste is not modelled; "daily" pickups collect e-waste on a schedule.
- Payments are not processed. Offers and payouts are recorded, the money changes hands outside Resortify.
