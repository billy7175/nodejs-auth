const express = require('express');
const router = express.Router();
const { setup2FA, verify2FA, disable2FA, reset2FA } = require('../controllers/twoFAController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: 2FA 설정 시작 (QR 코드 생성)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR 코드 및 백업 코드 반환
 *       401:
 *         description: 인증 실패
 */
router.post('/setup', authenticate, setup2FA);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: 2FA 검증 및 활성화
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
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA 활성화 성공
 *       401:
 *         description: 유효하지 않은 코드
 */
router.post('/verify', authenticate, verify2FA);

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     summary: 2FA 비활성화
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
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA 비활성화 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/disable', authenticate, disable2FA);

/**
 * @swagger
 * /api/auth/2fa/reset:
 *   post:
 *     summary: 2FA 초기화 (secret 삭제)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA 초기화 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/reset', authenticate, reset2FA);

module.exports = router;

