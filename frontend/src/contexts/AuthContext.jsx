import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const nav = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [plan, setPlan] = useState(null); // ✅ NEW
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMe()
            .then(r => {
                setUser(r.data.user);
                setProfile(r.data.profile);
                setPlan(r.data.plan); // ✅ NEW
            })
            .catch(() => {
                localStorage.removeItem('token');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async data => {
        const r = await apiLogin(data);
        localStorage.setItem('token', r.data.token);

        const me = await getMe();
        setUser(me.data.user);
        setProfile(me.data.profile);
        setPlan(me.data.plan); // ✅ NEW

        nav('/dashboard');
    };

    const register = async data => {
        const r = await apiRegister(data);
        localStorage.setItem('token', r.data.token);

        const me = await getMe();
        setUser(me.data.user);
        setProfile(me.data.profile);
        setPlan(me.data.plan); // ✅ NEW

        nav('/dashboard');
    };

    const logout = async () => {
        await apiLogout();
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
        setPlan(null); // ✅ NEW
        nav('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            plan, // ✅ NEW
            loading,
            setUser,
            setProfile,
            isAuthenticated: !!user,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
