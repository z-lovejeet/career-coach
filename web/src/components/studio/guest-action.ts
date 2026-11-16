export async function openGuestWorkspace(captchaToken?: string) {
  const response = await fetch("/api/auth/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captchaToken }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Guest access is temporarily unavailable.");
  }
  // Reload after the route handler sets the new session cookie.
  window.location.assign(new URL(result.redirect || "/dashboard", window.location.origin));
}
