require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// 데이터베이스 연결 후 서버 시작
const startServer = async () => {
  try {
    // MongoDB 연결
    await connectDB();

    // 서버 시작
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`   서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log('🚀 ========================================');
      console.log('');
      console.log(`   📌 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   📌 프론트엔드: http://localhost:${PORT}/`);
      console.log(`   📌 API: http://localhost:${PORT}/api`);
      console.log(`   📌 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`   📌 Health: http://localhost:${PORT}/health`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

startServer();

