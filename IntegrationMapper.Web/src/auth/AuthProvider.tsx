import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from './authConfig';
import { setAccessToken } from '../services/api';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: string | null;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    token: null,
    user: null,
    login: () => { },
    logout: () => { }
});

export const useAppAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const isDev = import.meta.env.DEV;
    const { instance, accounts } = useMsal();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null);

    // Sync token to API
    useEffect(() => {
        setAccessToken(token);
    }, [token]);

    // Dev Auth Logic
    const loginDev = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('dev_token', data.token);
                setToken(data.token);
                setUser("Dev User");
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Dev Login failed", error);
        }
    };

    // Prod Auth Logic (MSAL) is handled partly by MsalProvider, but we wrap it here to unify interface
    useEffect(() => {
        if (isDev) {
            // Auto-login for dev
            const stored = sessionStorage.getItem('dev_token');
            if (stored) {
                setToken(stored);
                setUser("Dev User");
                setIsAuthenticated(true);
            } else {
                loginDev();
            }
        } else {
            if (accounts.length > 0) {
                instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                }).then((response) => {
                    setToken(response.accessToken);
                    setUser(accounts[0].username);
                    setIsAuthenticated(true);
                }).catch((e) => {
                    console.error(e);
                });
            }
        }
    }, [isDev, accounts, instance]);

    const login = () => {
        if (isDev) loginDev();
        else instance.loginRedirect(loginRequest);
    };

    const logout = () => {
        if (isDev) {
            sessionStorage.removeItem('dev_token');
            setToken(null);
            setIsAuthenticated(false);
            setAccessToken(null); // Clear from API service
        } else {
            instance.logoutRedirect();
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
