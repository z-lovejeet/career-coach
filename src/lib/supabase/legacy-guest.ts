export const LEGACY_GUEST_EMAIL = 'guest.candidate@careerai.local';

export function isLegacyGuestEmail(email?: string | null) {
  return email?.trim().toLowerCase() === LEGACY_GUEST_EMAIL;
}
