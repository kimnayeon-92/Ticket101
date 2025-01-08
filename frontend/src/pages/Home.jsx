import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiFillStar, AiOutlineStar, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { getCurrentUser } from '@aws-amplify/auth';

const Home = () => {
    const [favorites, setFavorites] = useState([]);
    const [performances, setPerformances] = useState({
        recommended: [], // 추천 공연을 첫 번째로
        musical: [], 
        popular: [], 
        korean: [], 
        classical: []
    });
    const [currentSlide, setCurrentSlide] = useState({
        recommended: 0,
        musical: 0,
        popular: 0,
        korean: 0,
        classical: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5005/api/performances');
                const data = await response.json();
                
                const allPerformances = [
                    ...data.musical,
                    ...data.popular,
                    ...data.korean,
                    ...data.classical
                ];
                const shuffled = [...allPerformances].sort(() => 0.5 - Math.random());
                const recommended = shuffled.slice(0, 10);
                
                setPerformances({
                    ...data,
                    recommended
                });

                // 즐겨찾기 데이터 가져오기
                try {
                    const { username } = await getCurrentUser();
                    if (username) {
                        const favoritesResponse = await fetch(`http://localhost:5004/api/favorites/${username}`);
                        if (favoritesResponse.ok) {
                            const favoritesData = await favoritesResponse.json();
                            setFavorites(favoritesData);
                        }
                    }
                } catch (error) {
                    console.log('로그인 상태가 아닙니다.');
                }
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            }
        };

        fetchData();
    }, []);

    const handleFavorite = async (e, show) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const { username } = await getCurrentUser();
            if (!username) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            const isAlreadyFavorite = favorites.some(fav => fav.performance_id === show.performance_id);

            if (isAlreadyFavorite) {
                const response = await fetch(`http://localhost:5004/api/favorites/${username}/${show.performance_id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('즐겨찾기 삭제 실패');
                setFavorites(favorites.filter(fav => fav.performance_id !== show.performance_id));
            } else {
                const response = await fetch(`http://localhost:5004/api/favorites/${username}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        performance_id: show.performance_id,
                        image: show.image,
                        title: show.title,
                        start_date: show.start_date,
                        end_date: show.end_date
                    })
                });

                if (!response.ok) throw new Error('즐겨찾기 추가 실패');
                const newFavorite = await response.json();
                setFavorites([...favorites, newFavorite]);
            }
        } catch (error) {
            console.error('즐겨찾기 처리 중 에러:', error);
            alert('즐겨찾기 처리 중 오류가 발생했습니다.');
        }
    };

    const moveSlide = (genre, direction) => {
        const totalSlides = performances[genre].length;
        const maxSlides = Math.ceil(totalSlides / 5) - 1;
        
        setCurrentSlide(prev => ({
            ...prev,
            [genre]: direction === 'next' 
                ? Math.min(prev[genre] + 1, maxSlides)
                : Math.max(prev[genre] - 1, 0)
        }));
    };

    const genreNames = {
        recommended: "추천 공연",
        musical: "뮤지컬",
        popular: "대중음악",
        korean: "한국음악(국악)",
        classical: "서양음악(클래식)"
    };

    // 장르 순서를 정의
    const genreOrder = [
        'recommended',
        'musical',
        'popular',
        'korean',
        'classical'
    ];

    return (
        <main id="main" role="main">
            {genreOrder.map(genre => (
                <section key={genre}>
                    <h2 className="section__title">{genreNames[genre]}</h2>
                    <div className="show__list-container">
                        <button 
                            className="slide-btn prev" 
                            onClick={() => moveSlide(genre, 'prev')}
                            disabled={currentSlide[genre] === 0}
                        >
                            <AiOutlineLeft />
                        </button>
                        <div className="show__list" style={{
                            transform: `translateX(-${currentSlide[genre] * 100}%)`
                        }}>
                            {performances[genre].map(show => (
                                <div key={show.performance_id} className="show__item">
                                    <Link to={`/detail/${show.performance_id}`}>
                                        <div className="show__image-container">
                                            <img src={show.image} alt={show.title} />
                                            <button 
                                                className="favorite-btn"
                                                onClick={(e) => handleFavorite(e, show)}
                                            >
                                                {favorites.some(fav => fav.performance_id === show.performance_id) ? (
                                                    <AiFillStar className="star-icon active" />
                                                ) : (
                                                    <AiOutlineStar className="star-icon" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="show__info">
                                            <p className="show__title">{show.title}</p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <button 
                            className="slide-btn next" 
                            onClick={() => moveSlide(genre, 'next')}
                            disabled={currentSlide[genre] >= Math.ceil(performances[genre].length / 5) - 1}
                        >
                            <AiOutlineRight />
                        </button>
                    </div>
                </section>
            ))}
        </main>
    );
};

export default Home;
