export function getAuthErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.title === "string") {
    return responseData.title;
  }

  if (responseData?.errors && typeof responseData.errors === "object") {
    const messages = Object.values(responseData.errors)
      .flat()
      .filter((message) => typeof message === "string");

    if (messages.length) {
      return messages.join(" ");
    }
  }

  return error?.message || fallback;
}
