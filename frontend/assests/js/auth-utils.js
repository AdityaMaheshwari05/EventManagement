// auth-utils.js - Shared authentication functions

/**
 * Verifies if current user is an organizer
 * @returns {boolean}
 */
export function verifyOrganizer() {
  // First check localStorage user data
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role === "ORGANIZER") return true;

  // Fallback to token verification
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "ORGANIZER";
  } catch (e) {
    console.error("Token parse error:", e);
    return false;
  }
}

/**
 * Shows an alert message
 * @param {string} message
 * @param {string} type
 */
export function showAlert(message, type) {
  // Remove existing alerts
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove();

  // Create alert element
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
      <span>${message}</span>
      <button class="close-alert">&times;</button>
    `;

  document.body.appendChild(alert);

  // Auto-remove after 5 seconds
  const autoRemove = setTimeout(() => alert.remove(), 5000);

  // Manual close
  alert.querySelector(".close-alert").addEventListener("click", () => {
    clearTimeout(autoRemove);
    alert.remove();
  });
}
