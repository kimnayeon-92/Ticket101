import { createContext, useState, useContext, useEffect } from 'react';
import { Hub } from '@aws-amplify/core';
import { 
    getCurrentUser,
    fetchUserAttributes,
    signOut,
    signIn,
    signUp
} from '@aws-amplify/auth';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();

        const unsubscribe = Hub.listen('auth', ({ payload }) => {
            switch (payload.event) {
                case 'signIn':
                    checkUser();
                    break;
                case 'signOut':
                    handleSignOut();
                    break;
                default:
                    break;
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            const idToken = sessionStorage.getItem('idToken');
            if (!idToken) {
                setUser(null);
                return;
            }

            const currentUser = await getCurrentUser();
            const userAttributes = await fetchUserAttributes();
            setUser(userAttributes);
        } catch (error) {
            console.error('User check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        setUser(null);
        sessionStorage.clear(); // 세션 초기화
    };

    const login = async (username, password) => {
        try {
            const user = await signIn({ username, password });
            sessionStorage.setItem('idToken', user.signInUserSession.idToken.jwtToken); // 세션 스토리지에 토큰 저장
            setUser(user);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut();
            handleSignOut();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    const register = async (username, password, email) => {
        try {
            await signUp({
                username,
                password,
                attributes: {
                    email
                }
            });
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
