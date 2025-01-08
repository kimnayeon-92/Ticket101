const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS 설정
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// DynamoDB 연결 상태 확인
app.get('/health', async (req, res) => {
    try {
        const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        await client.config.credentials();
        res.status(200).json({
            status: 'healthy',
            message: 'DynamoDB connection successful',
            table: process.env.PERFORMANCE_TABLE
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            message: 'DynamoDB connection failed',
            error: error.message
        });
    }
});

// 공연 정보 라우터
app.use('/api/performances', require('./routes/performances'));

const PORT = process.env.PERFORMANCE_PORT || 5005;
app.listen(PORT, () => {
    console.log(`Performance service running on port ${PORT}`);
    console.log('Environment variables:');
    console.log(`- PORT: ${PORT}`);
    console.log(`- AWS Region: ${process.env.AWS_REGION}`);
    console.log(`- DynamoDB Table: ${process.env.PERFORMANCE_TABLE}`);
    console.log(`- Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;