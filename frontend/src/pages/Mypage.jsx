import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { AiFillStar } from "react-icons/ai";
import ShowCalendar from './ShowCalendar';
import { getCurrentUser } from '@aws-amplify/auth';

const Mypage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { username } = await getCurrentUser();
                if (!username) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`http://localhost:5004/api/favorites/${username}`);
                
                if (!response.ok) {
                    throw new Error('즐겨찾기 조회 실패');
                }

                const data = await response.json();
                console.log('Fetched favorites:', data);
                setFavorites(data);
            } catch (error) {
                console.error('즐겨찾기 로딩 중 에러:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const moveSlide = (direction) => {
        const totalSlides = favorites.length;
        const maxSlides = Math.ceil(totalSlides / 5) - 1;
        
        setCurrentSlide(prev => 
            direction === 'next' 
                ? Math.min(prev + 1, maxSlides)
                : Math.max(prev - 1, 0)
        );
    };

    const handleRemoveFavorite = async (performance_id) => {
        try {
            const { username } = await getCurrentUser();
            if (!username) {
                alert('로그인이 필요한 서비스입니다.');
                return;
            }

            const response = await fetch(`http://localhost:5004/api/favorites/${username}/${performance_id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('즐겨찾기 삭제 실패');
            
            setFavorites(favorites.filter(fav => fav.performance_id !== performance_id));
        } catch (error) {
            console.error('즐겨찾기 삭제 실패:', error);
            alert('즐겨찾기 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('모든 즐겨찾기를 삭제하시겠습니까?')) return;

        try {
            const { username } = await getCurrentUser();
            if (!username) return;

            const deletePromises = favorites.map(fav => 
                fetch(`http://localhost:5004/api/favorites/${username}/${fav.performance_id}`, {
                    method: 'DELETE'
                })
            );

            await Promise.all(deletePromises);
            setFavorites([]);
        } catch (error) {
            console.error('전체 삭제 실패:', error);
            alert('즐겨찾기 전체 삭제 중 오류가 발생했습니다.');
        }
    };

    if (loading) return <div>로딩 중...</div>;

    return (
        <main id="mypage">
            <div className="mypage__inner">
                <h2 className="mypage__title">MYPAGE</h2>
                
                <section className="mypage__section">
                    <div className="section__header">
                        <div className="header__left">
                            <h3>즐겨찾기</h3>
                            <AiFillStar className="star-icon" />
                            <span className="count">{favorites.length}</span>
                        </div>
                        <button 
                            className="delete-all-btn"
                            onClick={handleDeleteAll}
                            disabled={favorites.length === 0}
                        >
                            전체 삭제
                        </button>
                    </div>
                    <div className="show__list-container">
                        <button 
                            className="slide-btn prev" 
                            onClick={() => moveSlide('prev')}
                            disabled={currentSlide === 0 || favorites.length === 0}
                        >
                            <AiOutlineLeft />
                        </button>
                        <div className="show__list" style={{
                            transform: `translateX(-${currentSlide * 100}%)`
                        }}>
                            {favorites.length > 0 ? (
                                favorites.map(favorite => (
                                    <div key={favorite.performance_id} className="show__item">
                                        <Link to={`/detail/${favorite.performance_id}`}>
                                            <div className="show__image-container">
                                                <img src={favorite.image} alt={favorite.title} />
                                            </div>
                                            <p className="show__title">{favorite.title}</p>
                                            <button 
                                                className="remove-favorite"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveFavorite(favorite.performance_id);
                                                }}
                                            >
                                            </button>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-message">즐겨찾기한 공연이 없습니다.</p>
                            )}
                        </div>
                        <button 
                            className="slide-btn next" 
                            onClick={() => moveSlide('next')}
                            disabled={currentSlide >= Math.ceil(favorites.length / 5) - 1 || favorites.length === 0}
                        >
                            <AiOutlineRight />
                        </button>
                    </div>
                </section>

                <ShowCalendar events={favorites} />

                <section className="mypage__section">
                    <div className="section__header">
                        <h3>회원정보 수정</h3>
                    </div>
                    <div className="profile__edit">
                        <button className="edit__button">회원정보 수정하기</button>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Mypage;
