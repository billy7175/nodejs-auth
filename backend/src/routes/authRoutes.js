const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateRefreshToken,
} = require('../utils/validators');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 입력값 오류
 *       409:
 *         description: 이미 등록된 이메일
 */
router.post('/register', validateRegister, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 이메일 또는 비밀번호 불일치
 *       403:
 *         description: 비활성화된 계정
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /api/auth/login/2fa:
 *   post:
 *     summary: 2FA 로그인 검증
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - code
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: 로그인 시 받은 임시 토큰
 *               code:
 *                 type: string
 *                 description: Google Authenticator에서 받은 6자리 코드
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 입력값 오류
 *       401:
 *         description: 유효하지 않은 임시 토큰 또는 2FA 코드
 */
router.post('/login/2fa', authController.login2FA);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *       401:
 *         description: 유효하지 않은 Refresh Token
 */
router.post('/refresh', validateRefreshToken, authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: 내 정보 수정
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 새이름
 *     responses:
 *       200:
 *         description: 수정 성공
 *       401:
 *         description: 인증 실패
 */
router.put('/me', authenticate, authController.updateMe);

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: 회원탈퇴
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 탈퇴 성공
 *       401:
 *         description: 인증 실패
 */
router.delete('/me', authenticate, authController.deleteMe);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: 비밀번호 변경
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       401:
 *         description: 현재 비밀번호 불일치
 */
router.put('/password', authenticate, validateChangePassword, authController.changePassword);

module.exports = router;
