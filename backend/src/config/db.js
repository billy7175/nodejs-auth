const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB 연결 실패: ${error.message}`);
    process.exit(1);
  }
};

// 연결 이벤트 리스너
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB 연결 끊김');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB 에러: ${err}`);
});

module.exports = connectDB;

