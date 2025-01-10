import { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // 인증 상태 체크 함수
    const checkAuth = async () => {
        try {
            const user = await getCurrentUser();
            const isLoggedIn = !!user;
            setIsAuthenticated(isLoggedIn);
            localStorage.setItem('isLoggedIn', isLoggedIn.toString());
            console.log('인증 상태 업데이트:', isLoggedIn);
        } catch (error) {
            console.log('인증 확인 에러:', error);
            setIsAuthenticated(false);
            localStorage.removeItem('isLoggedIn');
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드 시 인증 상태 체크
    useEffect(() => {
        checkAuth();
    }, []);

    // 다른 탭/창의 로그인 상태 변경 감지
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'isLoggedIn') {
                setIsAuthenticated(e.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const value = {
        isAuthenticated,
        loading,
        checkAuth
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
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
