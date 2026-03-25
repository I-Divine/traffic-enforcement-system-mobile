import { apiClient } from "./client";

function normalizePaymentsError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to process payments request.";

  if (status) {
    return new Error(`Payments request failed (${status}): ${message}`);
  }

  if (error?.message === "Network Error" || error?.message === "Failed to fetch") {
    return new Error("Unable to reach the server. Check your network connection.");
  }

  return new Error(message);
}

export async function createPayment(payload) {
  try {
    const response = await apiClient.post("/payments", payload);
    return response?.data;
  } catch (error) {
    throw normalizePaymentsError(error);
  }
}

export async function getPayments() {
  try {
    const response = await apiClient.get("/payments");
    return response?.data;
  } catch (error) {
    throw normalizePaymentsError(error);
  }
}

export async function getPaymentTotals(period) {
  try {
    const response = await apiClient.get(`/payments/total?period=${period}`);
    return response?.data;
  } catch (error) {
    throw normalizePaymentsError(error);
  }
}
