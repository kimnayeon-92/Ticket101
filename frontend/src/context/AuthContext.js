import { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Cognito 세션 확인
            const currentUser = await getCurrentUser();
            if (currentUser) {
                // DynamoDB에서 사용자 정보 가져오기
                const response = await fetch(
                    `http://localhost:5002/api/auth/user/${currentUser.userId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const { user: userData } = await response.json();
                    setUser({
                        ...userData,
                        sub: currentUser.userId
                    });
                    localStorage.setItem('userInfo', JSON.stringify(userData));
                }
            } else {
                // 로그인된 사용자가 없으면 상태 초기화
                setUser(null);
                localStorage.removeItem('userInfo');
            }
        } catch (error) {
            console.error('인증 체크 에러:', error);
            setUser(null);
            localStorage.removeItem('userInfo');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        setUser,
        loading,
        checkAuth  // checkAuth 함수도 context에 포함
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
    }
    return context;
};
export default AuthContext;
