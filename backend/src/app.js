const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const twoFARoutes = require('./routes/twoFARoutes');

const app = express();

// ======================
// 미들웨어 설정
// ======================

// ======================
// 보안 헤더 설정 (Helmet)
// ======================
// 
// ⚠️ Content Security Policy (CSP) 비활성화 이유:
// 
// 현재 프로젝트는 React/Vue 같은 프레임워크를 사용하지 않고,
// 순수 HTML 파일(backend/public/*.html)에서 인라인 스크립트를 사용하고 있습니다:
// 
//   - <script> 태그 내부에 직접 JavaScript 코드 작성
//   - onclick="showTab()" 같은 인라인 이벤트 핸들러 사용
//   - <style> 태그 내부에 직접 CSS 작성
// 
// Helmet의 기본 CSP는 이러한 인라인 스크립트/스타일을 차단하므로,
// 테스트 페이지가 정상 작동하지 않아 CSP를 비활성화했습니다.
// 
// 📌 참고:
//   - React/Vue를 사용하면 빌드 시 자동으로 외부 JS 파일로 분리되므로
//     CSP를 false로 설정할 필요가 없습니다.
//   - 프로덕션 배포 시에는 반드시 CSP를 활성화하고,
//     인라인 스크립트를 외부 JS 파일로 분리해야 합니다.
// 
// 🔗 관련 문서: docs/CSP_EXPLANATION.md
//
app.use(helmet({
  contentSecurityPolicy: false,  // 인라인 스크립트 허용을 위해 CSP 비활성화
}));

// CORS 설정
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (프론트엔드 테스트 페이지)
app.use(express.static(path.join(__dirname, '../public')));

// 로깅 (개발 환경에서만 상세 로그)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ======================
// 라우트 설정
// ======================

// 헬스 체크
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '서버가 정상 작동 중입니다',
    timestamp: new Date().toISOString(),
  });
});

// API 문서 (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Node.js Auth API Docs',
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 인증 라우트
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFARoutes);

// ======================
// 에러 핸들러
// ======================

// 404 핸들러
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(globalErrorHandler);

module.exports = app;
