import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    const login = async (username, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Login failed');
            }

            const data = await response.json();
            setToken(data.access_token);
            setUser({ username }); // We only have username in response right now for simplicity

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify({ username }));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Registration failed');
            }

            // Auto login after successful registration
            return await login(username, password);
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
