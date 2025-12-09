const { verifyToken } = require('../utils/jwtUtils');
const { errorResponse } = require('../utils/responseUtils');
const User = require('../models/User');

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 검증합니다.
 */
const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, 401, '인증 토큰이 필요합니다', null, 'NO_TOKEN');
    }

    // Bearer 토큰 형식 확인
    if (!authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, '올바른 토큰 형식이 아닙니다', null, 'INVALID_TOKEN_FORMAT');
    }

    // 토큰 추출
    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, '토큰이 없습니다', null, 'NO_TOKEN');
    }

    // 토큰 검증
    const decoded = verifyToken(token);

    // Access Token인지 확인
    if (decoded.type !== 'access') {
      return errorResponse(res, 401, 'Access Token이 아닙니다', null, 'INVALID_TOKEN_TYPE');
    }

    // 사용자 조회
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 401, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, '비활성화된 계정입니다', null, 'ACCOUNT_DISABLED');
    }

    // req.user에 사용자 정보 첨부
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.code === 'TOKEN_EXPIRED') {
      return errorResponse(res, 401, error.message, null, 'TOKEN_EXPIRED');
    }
    if (error.code === 'INVALID_TOKEN') {
      return errorResponse(res, 401, error.message, null, 'INVALID_TOKEN');
    }
    return errorResponse(res, 401, '인증에 실패했습니다', null, 'AUTH_FAILED');
  }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과합니다.
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);

    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // 토큰 검증 실패해도 통과 (선택적이므로)
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};

