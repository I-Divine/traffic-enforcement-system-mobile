import { apiClient } from "./client";

function normalizeLookupError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message || error?.message || "Unable to search owner by plate.";

  if (status) {
    return new Error(`Plate lookup failed (${status}): ${message}`);
  }

  if (error?.message === "Network Error" || error?.message === "Failed to fetch") {
    return new Error("Unable to reach the server. Check your network connection.");
  }

  return new Error(message);
}

export async function findOwnerByPlate(plateNumber) {
  const plate = String(plateNumber || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!plate) {
    throw new Error("Enter a valid plate number.");
  }

  try {
    const response = await apiClient.get(
      `/owners/search?plateNumber=${encodeURIComponent(plate)}`
    );
    return response?.data;
  } catch (error) {
    throw normalizeLookupError(error);
  }
}
