# Environment Configuration Setup

## Files Created/Updated

### 1. `.env` (Main Environment File)
- **Development & Production**: Stores your API URLs
- **Location**: Root of project
- **Note**: Already in `.gitignore` - won't be committed to git

### 2. `.env.example` (Template for Developers)
- **Purpose**: Reference file showing required environment variables
- **Commit this to git** so team members know what to configure
- Update this file when adding new environment variables

### 3. `.env.development`
- Local development server configuration
- Uses localhost for API
- Auto-loaded by Vite when running `npm run dev`

### 4. `.env.production`
- Production server configuration
- Uses the production API URL
- Auto-loaded by Vite when building for production

### 5. `src/vite-env.d.ts` (TypeScript Types)
- Defines environment variable types for TypeScript support
- Prevents type errors when accessing `import.meta.env`

### 6. `src/services/agentAPI.ts` (Updated)
- Changed from hardcoded URL to: `import.meta.env.VITE_API_BASE_URL`
- Includes fallback to original URL if env var not found

## How It Works

### Local Development
```bash
npm run dev
```
- Loads `.env.development` 
- API calls go to `http://localhost:3000/api/v1`

### Production Build
```bash
npm run build
```
- Loads `.env.production`
- API calls go to `https://nodejs.service.callshivai.com/api/v1`
- Environment variables are baked into the build at compile time (secure)

## Deployment Instructions

1. **Copy `.env.example` to `.env`** on your server
2. **Update the values** in `.env` with your actual server URLs
3. **Never commit `.env`** - it's in `.gitignore`
4. **For different environments**, create separate `.env.staging`, `.env.production` files

## Environment Variable Rules

- Must start with `VITE_` prefix to be accessible in browser code
- Other prefixes like `VITE_APP_` also work
- Variables are replaced at build time (not runtime)
- Use `.env.example` to document all required variables

## Example Workflow

**Development:**
```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1

// In code (auto-resolved)
const api = import.meta.env.VITE_API_BASE_URL; 
// → "http://localhost:3000/api/v1"
```

**Production:**
```javascript
// .env.production
VITE_API_BASE_URL=https://nodejs.service.callshivai.com/api/v1

// In code (auto-resolved)
const api = import.meta.env.VITE_API_BASE_URL;
// → "https://nodejs.service.callshivai.com/api/v1"
```
