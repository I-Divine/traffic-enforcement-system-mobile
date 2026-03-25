import { apiClient } from "./client";

function normalizeVehicleError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to fetch vehicles.";

  if (status) {
    return new Error(`Vehicles request failed (${status}): ${message}`);
  }

  if (error?.message === "Network Error" || error?.message === "Failed to fetch") {
    return new Error("Unable to reach the server. Check your network connection.");
  }

  return new Error(message);
}

export async function getMyVehicles() {
  try {
    const response = await apiClient.get("/vehicles/me");
    return response?.data;
  } catch (error) {
    throw normalizeVehicleError(error);
  }
}
