const express = require('express');
const router = express.Router();
const { getKeycloak, isSsoEnabled } = require('../config/keycloak');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { generateTokens } = require('../utils/jwtUtils');
const User = require('../models/User');

/**
 * @swagger
 * /api/sso/status:
 *   get:
 *     summary: SSO 상태 확인
 *     tags: [SSO]
 *     responses:
 *       200:
 *         description: SSO 상태 정보
 */
router.get('/status', (req, res) => {
  return successResponse(res, 200, 'SSO 상태 조회', {
    enabled: isSsoEnabled(),
    provider: isSsoEnabled() ? 'Keycloak' : null,
    loginUrl: isSsoEnabled() ? '/api/sso/login' : null,
  });
});

/**
 * @swagger
 * /api/sso/login:
 *   get:
 *     summary: SSO 로그인 (Keycloak으로 리다이렉트)
 *     tags: [SSO]
 *     responses:
 *       302:
 *         description: Keycloak 로그인 페이지로 리다이렉트
 *       400:
 *         description: SSO가 비활성화됨
 */
router.get('/login', (req, res, next) => {
  if (!isSsoEnabled()) {
    return errorResponse(res, 400, 'SSO가 비활성화되어 있습니다', null, 'SSO_DISABLED');
  }

  const keycloak = getKeycloak();
  if (!keycloak) {
    return errorResponse(res, 500, 'Keycloak이 초기화되지 않았습니다', null, 'SSO_NOT_INITIALIZED');
  }

  // Keycloak 로그인 페이지로 리다이렉트
  return keycloak.protect()(req, res, next);
});

/**
 * @swagger
 * /api/sso/callback:
 *   get:
 *     summary: SSO 콜백 (로그인 후 처리)
 *     tags: [SSO]
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 */
router.get('/callback', async (req, res) => {
  if (!isSsoEnabled()) {
    return errorResponse(res, 400, 'SSO가 비활성화되어 있습니다', null, 'SSO_DISABLED');
  }

  try {
    // Keycloak에서 받은 사용자 정보
    if (!req.kauth || !req.kauth.grant) {
      return errorResponse(res, 401, 'SSO 인증 정보가 없습니다', null, 'NO_SSO_AUTH');
    }

    const token = req.kauth.grant.access_token;
    const content = token.content;

    const ssoUser = {
      ssoId: content.sub,
      email: content.email,
      name: content.name || content.preferred_username,
      emailVerified: content.email_verified,
    };

    // DB에서 사용자 찾기 또는 생성
    let user = await User.findOne({
      $or: [
        { ssoId: ssoUser.ssoId },
        { email: ssoUser.email },
      ],
    });

    if (!user) {
      // 새 사용자 생성 (SSO 사용자는 비밀번호 없음)
      user = await User.create({
        email: ssoUser.email,
        name: ssoUser.name,
        ssoId: ssoUser.ssoId,
        ssoProvider: 'keycloak',
        password: null, // SSO 사용자는 비밀번호 없음
      });
    } else if (!user.ssoId) {
      // 기존 사용자에 SSO 연동
      user.ssoId = ssoUser.ssoId;
      user.ssoProvider = 'keycloak';
      await user.save();
    }

    // JWT 토큰 발급
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return successResponse(res, 200, 'SSO 로그인 성공', {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('SSO 콜백 처리 에러:', error);
    return errorResponse(res, 500, 'SSO 로그인 처리 중 오류가 발생했습니다', null, 'SSO_CALLBACK_ERROR');
  }
});

/**
 * @swagger
 * /api/sso/logout:
 *   post:
 *     summary: SSO 로그아웃
 *     tags: [SSO]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
router.post('/logout', (req, res) => {
  if (!isSsoEnabled()) {
    return errorResponse(res, 400, 'SSO가 비활성화되어 있습니다', null, 'SSO_DISABLED');
  }

  // 세션에서 로그아웃
  if (req.session) {
    req.session.destroy();
  }

  // Keycloak 로그아웃 URL
  const keycloakLogoutUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
  const redirectUrl = process.env.APP_URL || 'http://localhost:3000';

  return successResponse(res, 200, '로그아웃 성공', {
    logoutUrl: `${keycloakLogoutUrl}?redirect_uri=${encodeURIComponent(redirectUrl)}`,
  });
});

// /api/sso/me는 제거 (중복: /api/auth/me 사용)
// SSO 로그인 후 /api/auth/me로 사용자 정보 조회 가능

module.exports = router;

