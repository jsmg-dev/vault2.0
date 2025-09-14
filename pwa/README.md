# Vault PWA (Progressive Web App)

This is the Progressive Web App version of the Vault Management System. It provides the same functionality as the web application but with enhanced mobile experience and offline capabilities.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices
- 🔄 **Offline Support**: Works offline with cached data
- 🚀 **Fast Loading**: Service worker caching for improved performance
- 📲 **Installable**: Can be installed on mobile devices like a native app
- 🔒 **Secure**: HTTPS required for PWA features

## PWA Features

### Web App Manifest
- App name: "Vault PWA"
- Theme color: #3b82f6 (Blue)
- Display mode: Standalone (looks like a native app)
- Icons: Multiple sizes for different devices

### Service Worker
- Caches essential files for offline access
- Automatic cache updates
- Background sync capabilities

### Mobile Optimizations
- Touch-friendly interface
- Responsive design
- Fast loading on mobile networks

## Installation

### For Users (Mobile)
1. Open the PWA in your mobile browser
2. Look for "Add to Home Screen" or "Install" prompt
3. Tap to install the app
4. The app will appear on your home screen

### For Development
1. Navigate to the pwa directory:
   ```bash
   cd pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build:pwa
   ```

## API Configuration

The PWA uses the same backend API as the main application:
- Backend URL: `http://localhost:8080`
- Database: PostgreSQL (shared with main app)

## PWA Requirements

### HTTPS
- PWA features require HTTPS in production
- Service workers only work over HTTPS (except localhost)

### Browser Support
- Chrome/Edge: Full support
- Firefox: Good support
- Safari: Limited support (iOS 11.3+)
- Mobile browsers: Full support

## File Structure

```
pwa/
├── src/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── main.ts                # Service worker registration
│   ├── index.html             # PWA meta tags
│   └── app/                   # Angular application
├── generate-icons.html        # Icon generator utility
└── README.md                  # This file
```

## Deployment

1. Build the PWA:
   ```bash
   npm run build:pwa
   ```

2. Deploy the `dist/` folder to your web server

3. Ensure HTTPS is enabled

4. Test PWA features in browser dev tools

## Testing PWA Features

1. Open Chrome DevTools
2. Go to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Test offline functionality

## Icons

Generate PWA icons by opening `generate-icons.html` in your browser and saving the generated icons to `src/assets/images/`.

## Troubleshooting

### Service Worker Not Working
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify service worker file is accessible

### Manifest Not Loading
- Check manifest.json syntax
- Ensure file is served with correct MIME type
- Verify manifest link in index.html

### Icons Not Showing
- Ensure icon files exist in assets/images/
- Check icon paths in manifest.json
- Verify icon sizes match manifest entries