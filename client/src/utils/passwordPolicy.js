/**
 * Shared client-side password policy, kept in sync with the server's
 * _validate_password_strength in server/auth/auth_models.py:
 * 8-128 characters with at least one letter and one number.
 *
 * Returns a human-readable reason the password is invalid, or null if valid.
 */
export function passwordInvalidReason(password) {
  if (typeof password !== "string") {
    return "Password must be at least 8 characters long";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters long";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}