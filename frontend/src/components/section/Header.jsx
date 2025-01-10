import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
    const { isAuthenticated, checkAuth } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const navigate = useNavigate();

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

    const onLogout = async () => {
        try {
            await signOut();
            await checkAuth();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('로그아웃 에러:', error);
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
            <div className='header__inner'>
                <nav className='header__nav left'>
                    <ul>
                        <li>
                            <Link to='/'>
                                <img src="/로고.png" alt="Ticket101" />
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className='header__logo'>
                    <Link to='/'>
                        <img src="/로고 글씨.png" alt="Ticket101" />
                    </Link>
                </div>
                <nav className='header__nav right'>
                    <ul>
                        <div className='header__search'>
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
                        <li><Link to='/Mypage'>마이페이지</Link></li>
                        <li>
                            {isAuthenticated ? (
                                <Link to='/' onClick={onLogout}>로그아웃</Link>
                            ) : (
                                <Link to='/Login'>로그인</Link>
                            )}
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header
