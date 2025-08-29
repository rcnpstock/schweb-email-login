// Automatically detect if we're in production or development
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === 'local.schwabtest.com';

export const base_url = isDevelopment 
  ? "https://local.schwabtest.com:3000"  // Development
  : window.location.origin;              // Production (use same domain as frontend)