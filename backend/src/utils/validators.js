const { errorResponse } = require('./responseUtils');

/**
 * 이메일 형식 검증
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 검증 (최소 8자, 영문+숫자)
 */
const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

/**
 * 회원가입 검증 미들웨어
 */
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: '올바른 이메일 형식이 아닙니다' });
  }

  if (!isValidPassword(password)) {
    errors.push({ field: 'password', message: '비밀번호는 최소 8자, 영문자와 숫자를 포함해야 합니다' });
  }

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: '이름은 필수입니다' });
  }

  if (errors.length > 0) {
    return errorResponse(res, 400, '입력값이 올바르지 않습니다', errors, 'VALIDATION_ERROR');
  }

  next();
};

/**
 * 로그인 검증 미들웨어
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: '올바른 이메일 형식이 아닙니다' });
  }

  if (!password) {
    errors.push({ field: 'password', message: '비밀번호는 필수입니다' });
  }

  if (errors.length > 0) {
    return errorResponse(res, 400, '입력값이 올바르지 않습니다', errors, 'VALIDATION_ERROR');
  }

  next();
};

/**
 * 비밀번호 변경 검증 미들웨어
 */
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: '현재 비밀번호는 필수입니다' });
  }

  if (!isValidPassword(newPassword)) {
    errors.push({ field: 'newPassword', message: '새 비밀번호는 최소 8자, 영문자와 숫자를 포함해야 합니다' });
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({ field: 'newPassword', message: '새 비밀번호는 현재 비밀번호와 달라야 합니다' });
  }

  if (errors.length > 0) {
    return errorResponse(res, 400, '입력값이 올바르지 않습니다', errors, 'VALIDATION_ERROR');
  }

  next();
};

/**
 * 토큰 갱신 검증 미들웨어
 */
const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, 400, 'Refresh Token은 필수입니다', null, 'VALIDATION_ERROR');
  }

  next();
};

module.exports = {
  isValidEmail,
  isValidPassword,
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateRefreshToken,
};
