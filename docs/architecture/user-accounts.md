# User Accounts / Cross-Device Sync

## Overview
Allow users to create accounts and sync their profile, contacts, and incident history across devices.

## Architecture
- **Supabase Auth** for email/phone authentication
- Supabase database already has incidents table
- Add `profiles` and `emergency_contacts` tables linked to auth.users
- **AsyncStorage** as local cache (already implemented)

## Schema Changes
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  blood_group TEXT,
  language TEXT,
  medical_info JSONB,
  crash_detection_enabled BOOLEAN DEFAULT true,
  crash_sensitivity TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Path
1. Add Sign Up / Sign In screens
2. On first sign-in, merge local AsyncStorage data to Supabase
3. Add "Sync" button in Settings
4. Use Supabase Realtime for live sync between devices
