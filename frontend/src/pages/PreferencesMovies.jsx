import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { Auth } from 'aws-amplify';

const PreferencesMovies = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { checkAuth } = useAuth();
  const userId = user?.sub; // user가 null이 아닌 경우에만 sub를 가져옴

  console.log('PreferencesMovie에서 userId 확인:', userId);
  console.log('userId 확인:', userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [error, setError] = useState(null);

  
  const { updateMoviePreferences, saveAllPreferences } = usePreferences();

  const searchMovies = async (query) => {
    try {
      const response = await fetch(`http://localhost:5003/api/survey/movies/search?query=${query}`);
      if (!response.ok) throw new Error('검색 실패');
      const data = await response.json();

      // 데이터 매핑
      return data.map(movie => ({
        movie_id: movie.movie_id,
        title: movie.title,
        genre: movie.genre,
        movie_num: movie.movie_num
      }));
    } catch (error) {
      console.error('영화 검색 오류:', error);
      return [];
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    if (query.length > 0) {
      const results = await searchMovies(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      handleSearch(e);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleMovieSelect = (movie) => {

    
    if (!selectedMovies.find(m => m.movie_id === movie.movie_id)) {
      setSelectedMovies([...selectedMovies, movie]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleMovieRemove = (movieId) => {
    setSelectedMovies(selectedMovies.filter(m => m.movie_id !== movieId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError('사용자 ID가 누락되었습니다. 다시 로그인 해주세요.');
      return;
    }

    try {
      if (selectedMovies.length < 3) {
        throw new Error('최소 3개의 영화를 선택해주세요.');
      }

      // 선택된 영화의 장르 번호를 포함한 전체 데이터 전달
      const movieData = selectedMovies.map(movie => ({
        movie_id: movie.movie_id,
        title: movie.title,
        genre: movie.genre,
        movie_num: movie.movie_num  // 장르 번호 포함
      }));

      // Context에 영화 데이터 저장
      updateMoviePreferences(movieData);

      // 모든 데이터 한 번에 저장
      console.log('사용자 ID:', userId);

      await saveAllPreferences(userId);
      await checkAuth();
      // 로그인 페이지로 이동
      navigate('/');
      
    } catch (error) {
      console.error('선호도 저장 에러:', error);
      setError(error.message);
    }
  };

  const isSubmitDisabled = selectedMovies.length < 3;

  return (
    <div className="preferences-movies">
      <div className="preferences-movies__inner">
        <h1>맞춤 공연 설문 조사</h1>
        <h2>좋아하는 영화를 검색 해주세요</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="text"
          placeholder="영화를 검색해주세요"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(movie => (
              <div
                key={movie.movie_id}
                onClick={() => handleMovieSelect(movie)}
                className="search-results__item"
              >
                {movie.title}
              </div>
            ))}
          </div>
        )}

        <div className="selected-items">
          <h3>선택된 영화 ({selectedMovies.length}/3)</h3>
          <div className="selected-items__list">
            {selectedMovies.map(movie => (
              <div key={movie.movie_id} className="selected-items__item">
                {movie.title}
                <button onClick={() => handleMovieRemove(movie.movie_id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="submit-button"
        >
          {isSubmitDisabled ? `3개 이상 영화를 선택해주세요 (${selectedMovies.length}/3)` : '완료'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesMovies; 