export function sanitizeUrl(url: string | undefined): string {
  if (!url) return 'about:blank';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {
    // URL parsing failed
  }
  return 'about:blank';
}
