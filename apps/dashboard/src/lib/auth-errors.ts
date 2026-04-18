type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

const authErrorMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password combination doesn't match our records.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  INVALID_EMAIL: "Enter a valid email address.",
  WEAK_PASSWORD: "Choose a stronger password before continuing.",
};

export function getAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
  fallback: string
) {
  if (!error) {
    return fallback;
  }

  if (error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }

  if (error.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return error.message || fallback;
}
