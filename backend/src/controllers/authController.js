const User = require('../models/User');
const { generateTokens, verifyToken } = require('../utils/jwtUtils');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { isSsoEnabled } = require('../config/keycloak');
const { createKeycloakUser, findKeycloakUser } = require('../utils/keycloakAdmin');

/**
 * 회원가입
 * POST /api/auth/register
 * 
 * SSO 활성화 시: Keycloak에만 저장 (표준 패턴)
 * SSO 비활성화 시: MongoDB에 저장 (일반 JWT 인증)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // SSO 활성화 시: Keycloak에만 저장 (표준 SSO 패턴)
    if (isSsoEnabled()) {
      try {
        // Keycloak에 이미 존재하는지 확인
        const keycloakUser = await findKeycloakUser(email);
        if (keycloakUser) {
          return errorResponse(res, 409, '이미 등록된 이메일입니다', null, 'KEYCLOAK_USER_EXISTS');
        }

        // Keycloak에 사용자 생성 (단일 소스)
        const keycloakUserId = await createKeycloakUser(email, password, name);
        console.log(`✅ Keycloak 사용자 생성 완료: ${email} (ID: ${keycloakUserId})`);

        // MongoDB는 저장하지 않음 (SSO 로그인 시 자동 동기화됨)
        return successResponse(res, 201, '회원가입이 완료되었습니다. SSO 로그인을 진행해주세요.', {
          message: 'Keycloak에 등록되었습니다. /api/sso/login으로 로그인하세요.',
          ssoEnabled: true,
          loginUrl: '/api/sso/login',
        });
      } catch (error) {
        console.error('Keycloak 사용자 생성 실패:', error.message);
        return errorResponse(res, 500, '회원가입 처리 중 오류가 발생했습니다', null, 'KEYCLOAK_CREATE_ERROR');
      }
    }

    // SSO 비활성화 시: MongoDB에 저장 (일반 JWT 인증)
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, '이미 등록된 이메일입니다', null, 'EMAIL_EXISTS');
    }

    // 내 DB에 사용자 생성
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
      ssoEnabled: false,
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

    // 토큰 생성
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

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  deleteMe,
};

