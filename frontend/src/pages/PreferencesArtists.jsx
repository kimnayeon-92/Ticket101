import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';

const PreferencesArtists = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const userId = user?.sub; // user가 null이 아닌 경우에만 sub를 가져옴
  console.log('PreferencesArtists에서 user 확인:', user);
  console.log('PreferencesArtists에서 userId 확인:', userId);


  const { updateArtistPreferences } = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [error, setError] = useState(null);

  const searchArtists = async (query) => {
    console.log('userId 확인:', userId);
    try {
      // 검색어 유효성 검사
      if (!query || query.length < 2) {
        throw new Error('검색어는 2글자 이상 입력해주세요.');
      }

      const response = await fetch(`http://localhost:5003/api/survey/artists/search?query=${query}`);
      const data = await response.json();
      
      // 서버 응답 확인
      if (!response.ok) {
        throw new Error(data.error || '검색 실패');
      }

      // 데이터가 배열인지 확인
      if (!Array.isArray(data)) {
        console.error('잘못된 응답 형식:', data);
        throw new Error('서버 응답 형식이 잘못되었습니다.');
      }

      // 데이터 매핑
      return data.map(artist => ({
        id: artist.artist_id,
        name: artist.artist_name,
        genre: artist.genre,
        artist_num: artist.artist_num
      }));
    } catch (error) {
      console.error('아티스트 검색 오류:', error);
      throw error; // 에러를 상위로 전파
    }
  };
  
  // 검색어 입력 처리
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    try {
      if (query.length >= 2) {
        const results = await searchArtists(query);
        setSearchResults(results);
        setError(null); // 검색 성공시 에러 초기화
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setError(error.message);
      setSearchResults([]);
    }
  };

  const handleArtistSelect = (artist) => {
    // if (!selectedArtists.find(a => a.id === artist.id)) {
    //   setSelectedArtists([...selectedArtists, artist]);
    // }
    console.log('선택된 아티스트:', artist);
    console.log('현재 선택된 아티스트 목록 (업데이트 전):', selectedArtists);

    setSelectedArtists((prevSelected) => {
      // 중복 확인 후 상태 업데이트
    console.log('현재 상태의 selectedArtists:', prevSelected);

    if (!prevSelected.some(a => a.id === artist.artist_id)) {
      const updated = [...prevSelected, artist];
      console.log('업데이트된 selectedArtists:', updated);
      return updated;
    }
    return prevSelected;
    });
      setSearchQuery('');
      setSearchResults([]);
    };

  const handleArtistRemove = (artistId) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId));
  };

  const handleSubmit = async () => {
    try {
      if (selectedArtists.length < 3) {
        throw new Error('최소 3명의 아티스트를 선택해주세요.');
      }

      // artist_number만 추출하여 저장
      const artistPreferences = selectedArtists.map(artist => ({
        artist_num: artist.artist_num
      }));

      // Context에 선택된 아티스트의 장르 번호만 저장
      updateArtistPreferences(artistPreferences);

      // 다음 페이지로 이동
      navigate('/preferences/movies');
    } catch (error) {
      console.error('아티스트 선호도 저장 에러:', error);
      setError(error.message);
    }
  };

  return (
    <div className="preferences-artists">
      <div className="preferences-artists__inner">
        <h1>맞춤 공연 설문 조사</h1>
        <h2>선호하는 가수를 검색 해주세요</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="text"
          placeholder="아티스트를 검색해주세요"
          className="search-input"
          value={searchQuery}
          onChange={handleSearch}
        />

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(artist => (
              <div
                key={artist.artist_id}
                onClick={() => handleArtistSelect(artist)}
                className="search-results__item"
              >
                {artist.name}
              </div>
            ))}
          </div>
        )}

        <div className="selected-items">
          <h3>선택된 아티스트 ({selectedArtists.length}/3)</h3>
          <div className="selected-items__list">
            {selectedArtists.map(artist => (
              <div key={artist.artist_id} className="selected-items__item">
                {artist.name}
                <button onClick={() => handleArtistRemove(artist.artist_id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedArtists.length < 3}
          className="submit-button"
        >
          {selectedArtists.length < 3 
            ? `3명 이상의 아티스트를 선택해주세요 (${selectedArtists.length}/3)` 
            : '다음'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesArtists;