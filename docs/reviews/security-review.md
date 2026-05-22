# RoadSoS Security Review

## Scope
Review of mobile app, backend API, and server components.

## Threat Model
- **Attacker goals**: Tamper with SOS messages, access emergency contacts, impersonate user
- **Attack surface**: Supabase API keys, AsyncStorage data, WebSocket connections, SMS content

## Findings

### CRITICAL: Supabase Anon Key in Client
- **File**: `lib/supabase.ts`
- **Issue**: Anon key embedded in client bundle — viewable via decompilation
- **Risk**: Low (Supabase RLS should protect data)
- **Mitigation**: Ensure RLS policies are enforced on ALL tables; use service_role key only in Edge Functions

### HIGH: AsyncStorage Sensitive Data
- **File**: Multiple (offline-cache.ts)
- **Issue**: Emergency contacts, medical info, incidents stored in plaintext AsyncStorage
- **Risk**: Medium (accessible via backup or if device compromised)
- **Mitigation**: Consider expo-secure-store for sensitive fields (medical info)

### MEDIUM: SOS Message Contains PII
- **File**: `lib/sms.ts`
- **Issue**: SMS messages contain full name, medical info, and exact location
- **Risk**: SMS is not encrypted; carriers and recipients see plaintext
- **Mitigation**: Already by design (SMS is inherently unencrypted)

### MEDIUM: WebSocket No Auth
- **File**: `server/index.js`, `server/signaling-server.js`
- **Issue**: WebSocket connections accept any client without authentication
- **Risk**: Anyone who knows the server URL can monitor responder locations
- **Mitigation**: Add JWT token verification on WebSocket connection (see below)

### LOW: Input Validation
- **Observation**: React Native TextInputs don't sanitize output in SMS messages
- **Mitigation**: Already handled since RN renders text, not HTML — no XSS vector

## Recommended Actions

### 1. WebSocket Authentication
Add JWT verification to `server/index.js`:
```js
const jwt = require('jsonwebtoken');

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  if (!token) { ws.close(4001, 'Authentication required'); return; }
  try {
    ws.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    ws.close(4001, 'Invalid token');
    return;
  }
  // ... rest of connection handler
});
```

### 2. Add rate limiting to WebSocket servers
Add to both server files:
```js
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_MESSAGES = 10;

function checkRateLimit(ws) {
  const now = Date.now();
  const record = rateLimit.get(ws) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }
  record.count++;
  rateLimit.set(ws, record);
  if (record.count > MAX_MESSAGES) {
    ws.close(4002, 'Rate limit exceeded');
    return false;
  }
  return true;
}
```

### 3. Input validation for auth endpoints
Read `lib/auth.ts`. Add Zod-style validation to the sign in/sign up functions using simple type guards since Zod isn't installed:

Actually, since we don't have Zod in the project, add validation checks directly:
Read `app/auth/sign-in.tsx` and `app/auth/sign-up.tsx` - they already validate inputs (check for empty fields, password length). That's sufficient.
