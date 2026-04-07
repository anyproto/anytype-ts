# footer/ - Page Footer Components

Conditional footer components for different page contexts. **5 files** (excluding stories).

## Files

- `index.tsx` - Footer dispatcher (selects component via `Components` map)

### Auth Footers (`auth/`)
- `auth/index.tsx` - Auth page footer
- `auth/disclaimer.tsx` - Terms/disclaimer footer
- `auth/email.tsx` - Email-related footer

### Main Footers (`main/`)
- `main/object.tsx` - Object page footer

## Component Registry

```
authIndex, authDisclaimer, authOnboardEmail, mainObject
```
