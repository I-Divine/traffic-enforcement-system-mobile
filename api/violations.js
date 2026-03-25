import { apiClient } from "./client";

function normalizeViolationsError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to fetch violations.";

  if (status) {
    return new Error(`Violations request failed (${status}): ${message}`);
  }

  if (error?.message === "Network Error" || error?.message === "Failed to fetch") {
    return new Error("Unable to reach the server. Check your network connection.");
  }

  return new Error(message);
}

export async function getOwnerViolations() {
  try {
    const response = await apiClient.get("/violations/owner");
    return response?.data;
  } catch (error) {
    throw normalizeViolationsError(error);
  }
}

export async function createViolation(payload) {
  try {
    const response = await apiClient.post("/violations", payload);
    return response?.data;
  } catch (error) {
    throw normalizeViolationsError(error);
  }
}

export async function getViolationTypes() {
  try {
    const response = await apiClient.get("/violations/types");
    return response?.data;
  } catch (error) {
    throw normalizeViolationsError(error);
  }
}
