export const LEGACY_GUEST_EMAIL = 'guest.candidate@careerai.local';

export function isLegacyGuestEmail(email?: string | null) {
  return email?.trim().toLowerCase() === LEGACY_GUEST_EMAIL;
}

export function isGuestEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === LEGACY_GUEST_EMAIL ||
    (normalized.startsWith('guest.') && normalized.endsWith('@careerai.local'))
  );
}
