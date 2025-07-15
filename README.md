# Mithila Bhog Bazaar

## Deployment Notes

### Fixed White Page Issue on Vercel

The following changes were made to fix the white page issue on Vercel deployment:

1. **Updated vercel.json**: Improved routing configuration to properly handle SPA routes
2. **Added SPA routing files**:
   - Added _redirects file
   - Added 200.html as a fallback
   - Added _vercel.json in the public directory
3. **Improved ProductDetail component**:
   - Added better error handling for image loading
   - Added fallback images
   - Fixed image rendering issues
4. **Added postbuild script**:
   - Created vercel-build.cjs to handle post-build tasks
   - Automatically generates 200.html and _redirects
5. **Updated Vite config**:
   - Fixed asset hashing for better caching
   - Improved build configuration

These changes ensure that direct navigation to routes like `/products/[id]` works correctly on Vercel deployments.

## Development

### Getting Started

To run the project locally:

```bash
npm install
npm run dev
```

### Building for Production

```bash
npm run build
```
