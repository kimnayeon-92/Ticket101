import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUserAttributes, signOut, getCurrentUser } from '@aws-amplify/auth';

const Header = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // 세션 스토리지 확인
            const idToken = sessionStorage.getItem('idToken');
            if (!idToken) {
                console.log('세션 스토리지가 비어 있으므로 로그아웃 처리');
                setIsAuthenticated(false);
                return;
            }

            // Amplify 인증 확인
            await getCurrentUser();
            setIsAuthenticated(true);
        } catch (error) {
            console.error('로그인 상태 확인 실패:', error);
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        const controlHeader = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', controlHeader);

        return () => {
            window.removeEventListener('scroll', controlHeader);
        };
    }, [lastScrollY]);

    const handleLogout = async () => {
        try {
            await signOut();
            sessionStorage.clear(); // 세션 스토리지 초기화
            setIsAuthenticated(false);
            navigate('/');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    return (
        <header id="header" className={`${isVisible ? '' : 'header-hidden'}`}>
            <div className="header__inner">
                <nav className="header__nav left">
                    <ul>
                        <li>
                            <Link to="/">
                                <img src="/로고.png" alt="Ticket101" />
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="header__logo">
                    <Link to="/">
                        <img src="/로고 글씨.png" alt="Ticket101" />
                    </Link>
                </div>
                <nav className="header__nav right">
                    <ul>
                        <div className="header__search">
                            <form onSubmit={handleSearch}>
                                <div className="search-input-wrapper">
                                    <span className="search-icon"></span>
                                    <input
                                        type="search"
                                        placeholder="공연을 검색하세요"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>
                        <li><Link to="/Mypage">마이페이지</Link></li>
                        <li>
                            {isAuthenticated ? (
                                <button className="logout-btn" onClick={handleLogout}>
                                    로그아웃
                                </button>
                            ) : (
                                <Link to="/Login">로그인</Link>
                            )}
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
