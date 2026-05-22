# Security Recommendations

## Implemented
- [x] Supabase RLS policies on profiles and user_contacts tables
- [x] Input validation on auth forms (email format, password length)
- [x] try/catch on all data operations (no crash on failure)
- [x] Generic error messages on auth failure (no user enumeration)
- [x] JWT stored in AsyncStorage via Supabase SDK
- [x] JWT authentication on WebSocket responder connections
- [x] Rate limiting on WebSocket servers

## Recommended
- [ ] Encrypt medical info with expo-secure-store
- [ ] Add app integrity check (SSL pinning)
- [ ] Add biometric auth for app access
- [ ] Sanitize incident data before Supabase insert
- [ ] Add request signing for Edge Function invocations
