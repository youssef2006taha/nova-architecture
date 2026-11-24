export function getAdminErrorMessage(error, fallback, messages = {}) {
  const status = error?.response?.status;

  if (status === 400 || status === 422) {
    return messages.adminRequestRejected || fallback;
  }
  if (status === 401 || status === 403) {
    return messages.adminAccessDenied || fallback;
  }
  if (status === 404) {
    return messages.adminResourceNotFound || fallback;
  }
  if (status === 409) {
    return messages.adminConflict || fallback;
  }
  if (status === 429) {
    return messages.adminRateLimited || fallback;
  }
  if (status >= 500) {
    return messages.adminServerError || fallback;
  }

  return fallback;
}
