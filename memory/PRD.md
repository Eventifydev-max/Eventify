# Shaadi Sewa — Wedding Services Booking App (PRD)

## Overview
Mobile-first marketplace connecting Indian wedding planners (customers) with venue/service providers (vendors). Built with React Native (Expo) + FastAPI + MongoDB.

## Roles
1. **Customer** — Browse, book, pay for wedding services. Leave reviews.
2. **Vendor** — List their gardens/resorts/pandits/videography studios. Receive bookings, manage listings.

## Authentication
- **SMS OTP based** (no password). Same phone can register separately as customer and vendor.
- Demo mode: OTP is hardcoded `123456` (mock). Production-ready to plug Twilio/MSG91.
- JWT Bearer token, stored in AsyncStorage.

## Core Features

### Customer
- Splash → Role Select → Phone → OTP → Home
- Bento-style category browser (Gardens, Pandits, Videographers)
- Search & filter (by category, query)
- Service detail with image carousel, packages, features, reviews
- Booking flow: choose package → date → notes → mock payment (UPI/Card/Netbanking) → confirmation
- My Bookings list with status (pending/confirmed)
- Add reviews on services (1-5 stars + comment); aggregate rating updates incrementally

### Vendor
- Vendor splash redirect → Dashboard with stats (Earnings, Bookings, Listings, Avg Rating, Reviews)
- My Listings with view/delete actions
- Add Listing form: category, business details, packages (dynamic), features, images
- Booking Orders: see who booked, status, contact info
- Profile + logout

## Tech
- Backend: FastAPI, MongoDB (motor), JWT, bcrypt-not-needed (OTP)
- Frontend: Expo Router (file routing), React Native, AsyncStorage, expo-linear-gradient, datetimepicker
- Theme: Royal Indian — crimson #B22222, gold #D4AF37, ivory #FAF9F6, Cormorant Garamond serif

## Future Enhancements (not yet implemented)
- Twilio SMS for real OTP
- Vendor analytics dashboard
- Image upload (currently URL-based)
- Razorpay/Stripe live payment
- Push notifications
- Bilingual (Hindi/English) toggle
