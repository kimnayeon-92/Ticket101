const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const db = new Database();

// 모든 공연 정보 가져오기
router.get('/', async (req, res) => {
    try {
        console.log('공연 정보 조회 시작');
        
        const today = new Date().toISOString().split('T')[0];
        // console.log('현재 날짜:', today);
        
        const performances = await db.getAllPerformances();

        // 현재 진행 중이거나 예정된 공연 필터링
        const filteredPerformances = performances
            .filter(show => 
                show.end_date !== "오픈런" && 
                show.end_date >= today
            )
            .sort((a, b) => {
                const diffA = Math.abs(new Date(a.start_date) - new Date(today));
                const diffB = Math.abs(new Date(b.start_date) - new Date(today));
                return diffA - diffB;
            });

        // console.log('필터링 후 공연 수:', filteredPerformances.length);

        // 장르별로 분류
        const categorizedResult = {
            musical: filteredPerformances.filter(p => p.genre === "뮤지컬"),
            popular: filteredPerformances.filter(p => p.genre === "대중음악"),
            korean: filteredPerformances.filter(p => p.genre === "한국음악(국악)"),
            classical: filteredPerformances.filter(p => p.genre === "서양음악(클래식)")
        };

        res.json(categorizedResult);
    } catch (error) {
        console.error('서버 에러:', error);
        res.status(500).json({ 
            error: '서버 에러',
            message: error.message 
        });
    }
});

// 단일 공연 정보 조회
router.get('/:id', async (req, res) => {
    try {
        const performance = await db.getPerformanceById(req.params.id);

        if (!performance) {
            return res.status(404).json({ message: '공연을 찾을 수 없습니다.' });
        }

        res.json(performance);
    } catch (error) {
        console.error('공연 상세 정보 조회 에러:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;