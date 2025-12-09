const { errorResponse } = require('../utils/responseUtils');

/**
 * 404 Not Found 핸들러
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `요청한 리소스를 찾을 수 없습니다: ${req.originalUrl}`, null, 'NOT_FOUND');
};

/**
 * 전역 에러 핸들러
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose 유효성 검사 에러
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, 400, '입력값이 올바르지 않습니다', errors, 'VALIDATION_ERROR');
  }

  // Mongoose 중복 키 에러
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(
      res,
      409,
      `이미 사용 중인 ${field}입니다`,
      [{ field, message: `이미 사용 중인 ${field}입니다` }],
      'DUPLICATE_ERROR'
    );
  }

  // Mongoose CastError (잘못된 ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, '잘못된 ID 형식입니다', null, 'INVALID_ID');
  }

  // JWT 에러
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, '유효하지 않은 토큰입니다', null, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, '토큰이 만료되었습니다', null, 'TOKEN_EXPIRED');
  }

  // 기본 에러 응답
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '서버 오류가 발생했습니다' 
    : err.message || '서버 오류가 발생했습니다';

  return errorResponse(res, statusCode, message, null, 'SERVER_ERROR');
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};

