import { type Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "your-client-id", // Placeholder
        authority: "https://login.microsoftonline.com/your-tenant-id", // Placeholder
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // Validates "Token only exists in session" requirements
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["User.Read"] // Adjust as needed for API access
};
