/**
 * Utility to normalize image URLs across the application.
 * Fixes relative paths like './src/assets/images/...' to proper root-relative public paths '/images/...',
 * ensuring images load correctly across all nested routes (/rent, /rent/products/:id, /rent/orders/:id, etc.).
 */
export function normalizeImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already a full web URL (http:// or https://) or base64 data URL
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  // If path contains src/assets/images/ (e.g. ./src/assets/images/foo.jpg or /src/assets/images/foo.jpg)
  if (trimmed.includes('src/assets/images/')) {
    const filename = trimmed.split('src/assets/images/').pop() || '';
    return `/images/${filename.replace(/^\/+/, '')}`;
  }

  // If path starts with ./ or ../
  if (trimmed.startsWith('./')) {
    return '/' + trimmed.slice(2);
  }
  if (trimmed.startsWith('../')) {
    return '/' + trimmed.replace(/^(\.\.\/)+/, '');
  }

  // Ensure leading slash for root-relative paths
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }

  return trimmed;
}
