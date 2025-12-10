const User = require('../models/User');
const { generateTokens, verifyToken, generateTempToken, verifyTempToken } = require('../utils/jwtUtils');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { authenticator } = require('otplib');

/**
 * 회원가입
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, '이미 등록된 이메일입니다', null, 'EMAIL_EXISTS');
    }

    // 새 사용자 생성
    const user = await User.create({
      email,
      password,
      name,
    });

    // 토큰 생성
    const tokens = generateTokens(user);

    // Refresh Token 저장
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return successResponse(res, 201, '회원가입이 완료되었습니다', {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 로그인
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 사용자 조회 (비밀번호 포함)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다', null, 'INVALID_CREDENTIALS');
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      return errorResponse(res, 403, '비활성화된 계정입니다', null, 'ACCOUNT_DISABLED');
    }

    // 비밀번호 검증
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다', null, 'INVALID_CREDENTIALS');
    }

    // 2FA 활성화 여부 확인
    if (user.is2FAEnabled) {
      // 2FA 활성화된 경우: 임시 토큰만 발급
      const tempToken = generateTempToken({
        userId: user._id.toString(),
        email: user.email,
      });

      return successResponse(res, 200, '2FA 코드를 입력해주세요', {
        requires2FA: true,
        tempToken: tempToken,
        message: 'Google Authenticator에서 6자리 코드를 입력해주세요',
      });
    }

    // 2FA 비활성화된 경우: 바로 토큰 발급
    const tokens = generateTokens(user);

    // Refresh Token 및 마지막 로그인 시간 업데이트
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return successResponse(res, 200, '로그인 성공', {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requires2FA: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Refresh Token 삭제
    await User.findByIdAndUpdate(req.userId, {
      refreshToken: null,
    });

    return successResponse(res, 200, '로그아웃 되었습니다');
  } catch (error) {
    next(error);
  }
};

/**
 * 토큰 갱신
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    // 토큰 검증
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return errorResponse(res, 401, '유효하지 않은 Refresh Token입니다', null, 'INVALID_TOKEN');
    }

    // Refresh Token 타입 확인
    if (decoded.type !== 'refresh') {
      return errorResponse(res, 401, 'Refresh Token이 아닙니다', null, 'INVALID_TOKEN_TYPE');
    }

    // 사용자 조회 및 저장된 Refresh Token 확인
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user) {
      return errorResponse(res, 401, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    if (user.refreshToken !== token) {
      return errorResponse(res, 401, '유효하지 않은 Refresh Token입니다', null, 'INVALID_TOKEN');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, '비활성화된 계정입니다', null, 'ACCOUNT_DISABLED');
    }

    // 새 토큰 생성
    const tokens = generateTokens(user);

    // 새 Refresh Token 저장
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return successResponse(res, 200, '토큰이 갱신되었습니다', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, '사용자 정보 조회 성공', {
      user: req.user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 정보 수정
 * PUT /api/auth/me
 */
const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, '정보가 수정되었습니다', {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 비밀번호 변경
 * PUT /api/auth/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 현재 비밀번호가 포함된 사용자 조회
    const user = await User.findById(req.userId).select('+password');

    // 현재 비밀번호 확인
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return errorResponse(res, 401, '현재 비밀번호가 올바르지 않습니다', null, 'INVALID_PASSWORD');
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    
    // 모든 세션 무효화 (Refresh Token 삭제)
    user.refreshToken = null;
    
    await user.save();

    // 새 토큰 발급
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return successResponse(res, 200, '비밀번호가 변경되었습니다', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 계정 삭제 (회원탈퇴)
 * DELETE /api/auth/me
 */
const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.userId);

    return successResponse(res, 200, '계정이 삭제되었습니다');
  } catch (error) {
    next(error);
  }
};

/**
 * 2FA 로그인 검증
 * POST /api/auth/login/2fa
 */
const login2FA = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return errorResponse(res, 400, '임시 토큰과 2FA 코드를 입력해주세요', null, 'MISSING_FIELDS');
    }

    // 임시 토큰 검증
    let decoded;
    try {
      decoded = verifyTempToken(tempToken);
    } catch (error) {
      if (error.code === 'TEMP_TOKEN_EXPIRED') {
        return errorResponse(res, 401, '임시 토큰이 만료되었습니다. 다시 로그인해주세요.', null, 'TEMP_TOKEN_EXPIRED');
      }
      return errorResponse(res, 401, '유효하지 않은 임시 토큰입니다', null, 'INVALID_TEMP_TOKEN');
    }

    // 사용자 조회 (2FA secret 포함)
    const user = await User.findById(decoded.userId).select('+totpSecret');

    if (!user) {
      return errorResponse(res, 404, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    if (!user.is2FAEnabled || !user.totpSecret) {
      return errorResponse(res, 400, '2FA가 활성화되어 있지 않습니다', null, '2FA_NOT_ENABLED');
    }

    // 코드 정리
    const cleanCode = String(code).trim().replace(/\s/g, '');

    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return errorResponse(res, 400, '6자리 숫자 코드를 입력해주세요', null, 'INVALID_CODE_FORMAT');
    }

    // OTP 코드 검증
    const isValid = authenticator.verify({
      token: cleanCode,
      secret: user.totpSecret,
      window: [2, 2], // 전후 60초 허용
    });

    if (!isValid) {
      return errorResponse(res, 401, '유효하지 않은 2FA 코드입니다', null, 'INVALID_2FA_CODE');
    }

    // 검증 성공: 최종 토큰 발급
    const tokens = generateTokens(user);

    // Refresh Token 및 마지막 로그인 시간 업데이트
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return successResponse(res, 200, '로그인 성공', {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  login2FA,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  deleteMe,
};

