const jwt = require('jsonwebtoken');

/**
 * Access Token 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} Access Token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    }
  );
};

/**
 * Refresh Token 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    }
  );
};

/**
 * Access Token과 Refresh Token 쌍 생성
 * @param {Object} user - 사용자 객체
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} 디코딩된 토큰 데이터
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('토큰이 만료되었습니다');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('유효하지 않은 토큰입니다');
      err.code = 'INVALID_TOKEN';
      throw err;
    }
    throw error;
  }
};

/**
 * 토큰에서 페이로드 추출 (만료 여부와 관계없이)
 * @param {string} token - 토큰
 * @returns {Object|null} 디코딩된 페이로드
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
};

