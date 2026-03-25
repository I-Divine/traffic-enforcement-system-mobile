import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { BASE_URL } from "./client"
import { getToken } from "./tokenStorage";

export const getUserProfile = async () => {
    try {
        const token = await getToken();
        console.log("Token -> "+token);
        const response = await fetch(BASE_URL + "/api/v1/users/me", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        }).then(res => res.json());
        return response;
    } catch (error) {
        throw error;
    }
}