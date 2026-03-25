import { apiClient, BASE_URL } from "./client";
import { storeToken } from "./tokenStorage";

function extractToken(data) {
  if (typeof data === "string") return data;
  if (!data) return null;
  if (data.token) return data.token;
  return null;
}

function normalizeError(error) {
  if (error.status) {
    const message =
      error.message || `Request failed with status ${error.status}.`;
    return new Error(message);
  }

  if (error.message === "Failed to fetch") {
    return new Error(
      "Unable to reach the server. Check your network connection."
    );
  }

  return new Error(error?.message || "Something went wrong. Please try again.");
}

export async function login(email, password) {
  try {
    const response = await fetch(BASE_URL + "/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    let data = await response.json();
    const token = extractToken(data);
    if (!token) {
      throw new Error("Login response did not include a token.");
    }
    await storeToken(token);
    return data;
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    if (error.status) {
      console.log("STATUS:", error.status);
      console.log("DATA:", error.data);
    }
    throw normalizeError(error);
  }
}

export async function changePassword(oldPassword, newPassword) {
  try {
    const response = await apiClient.patch("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("[CHANGE PASSWORD ERROR]", error);
    const message = error?.response?.data?.message || error?.message || "Failed to change password";
    throw new Error(message);
  }
}
