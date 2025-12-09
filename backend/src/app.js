const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const ssoRoutes = require('./routes/ssoRoutes');
const { isSsoEnabled, initKeycloak, getSessionMiddleware } = require('./config/keycloak');

const app = express();

// ======================
// 미들웨어 설정
// ======================

// 보안 헤더 설정
app.use(helmet());

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

// 로깅 (개발 환경에서만 상세 로그)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ======================
// SSO 설정 (Flag 기반)
// ======================

if (isSsoEnabled()) {
  console.log('🔐 SSO 모드 활성화');
  
  // 세션 미들웨어 (SSO에 필요)
  app.use(getSessionMiddleware());
  
  // Keycloak 초기화
  const keycloak = initKeycloak();
  
  if (keycloak) {
    // Keycloak 미들웨어 등록
    app.use(keycloak.middleware({
      logout: '/api/sso/logout',
      admin: '/',
    }));
  }
} else {
  console.log('🔑 JWT 모드 (SSO 비활성화)');
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
    ssoEnabled: isSsoEnabled(),
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

// 인증 라우트 (JWT 기반)
app.use('/api/auth', authRoutes);

// SSO 라우트 (Keycloak) - SSO 활성화 시에만 등록
if (isSsoEnabled()) {
  app.use('/api/sso', ssoRoutes);
}

// ======================
// 에러 핸들러
// ======================

// 404 핸들러
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(globalErrorHandler);

module.exports = app;
