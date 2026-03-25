import { apiClient } from "./client";

function normalizeAppealError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to submit appeal.";

  if (status) {
    return new Error(`Appeal request failed (${status}): ${message}`);
  }

  if (error?.message === "Network Error" || error?.message === "Failed to fetch") {
    return new Error("Unable to reach the server. Check your network connection.");
  }

  return new Error(message);
}

export async function createAppeal(payload) {
  try {
    const response = await apiClient.post("/appeals", payload);
    return response?.data;
  } catch (error) {
    throw normalizeAppealError(error);
  }
}
