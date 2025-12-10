# 🔐 Node.js Authentication Backend

JWT 기반의 사용자 인증 시스템을 구현한 Node.js 백엔드 서버입니다.

## 📁 프로젝트 구조

```
nodejs-auth/
├── backend/                 # Node.js API 서버
│   ├── src/
│   │   ├── config/          # 설정 파일
│   │   ├── controllers/     # 컨트롤러
│   │   ├── middlewares/     # 미들웨어
│   │   ├── models/          # Mongoose 모델
│   │   ├── routes/          # API 라우트
│   │   ├── utils/           # 유틸리티
│   │   └── app.js           # Express 앱
│   ├── .env.example         # 환경 변수 예시
│   ├── package.json
│   └── server.js            # 진입점
├── frontend/                # (예정) 프론트엔드
├── docs/                    # 설계 문서
│   ├── ARCHITECTURE.md
│   └── ADVANCED_AUTH.md
└── README.md
```

## 🚀 시작하기

### 사전 요구사항

- Node.js v18 이상
- MongoDB (로컬 또는 Atlas)

### 설치 및 실행

```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 설정 수정

# 4. 개발 서버 실행
npm run dev

# 또는 프로덕션 실행
npm start
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 값을 설정하세요:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nodejs-auth
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

## 📚 API 문서

서버 실행 후 Swagger UI에서 API 문서를 확인할 수 있습니다:

```
http://localhost:4000/api-docs
```

## 🌐 프론트엔드 테스트 페이지

서버 실행 후 브라우저에서 테스트 페이지에 접속할 수 있습니다:

```
http://localhost:4000/
```

**사용 가능한 페이지:**
- 메인 페이지: `http://localhost:4000/` (회원가입, 로그인, 내 정보)
- 2FA 설정: `http://localhost:4000/2fa-setup.html`
- Passkey 테스트: `http://localhost:4000/passkey.html`

## 🔗 API 엔드포인트

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |
| POST | `/api/auth/refresh` | 토큰 갱신 | ❌ |
| GET | `/api/auth/me` | 내 정보 조회 | ✅ |
| PUT | `/api/auth/me` | 내 정보 수정 | ✅ |
| DELETE | `/api/auth/me` | 회원탈퇴 | ✅ |
| PUT | `/api/auth/password` | 비밀번호 변경 | ✅ |

## 🧪 API 테스트 (cURL 예시)

### 회원가입

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "테스트"}'
```

### 로그인

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 내 정보 조회 (인증 필요)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛡️ 보안 기능

- ✅ bcrypt 비밀번호 해싱 (Salt Rounds: 12)
- ✅ JWT Access/Refresh Token
- ✅ Helmet 보안 헤더
- ✅ CORS 설정
- ✅ Rate Limiting (로그인 시도 제한)
- ✅ 입력값 유효성 검사

## 📖 문서

> **📚 [문서 인덱스](./docs/README.md)** - 모든 문서를 카테고리별로 정리한 가이드

### 주요 문서

- [기본 설계 문서](./docs/ARCHITECTURE.md) - JWT, 비밀번호 암호화 등 기본 구조
- [고급 인증 문서](./docs/ADVANCED_AUTH.md) - OTP, Passkey, 소셜 로그인 등
- [2FA 가이드](./docs/2FA_GUIDE.md) - 2단계 인증 사용법
- [SSO 설정](./docs/SSO_SETUP.md) - Keycloak SSO 설정 방법
- [테스트 가이드](./docs/NO_UI_TESTING.md) - 프론트엔드 없이 테스트하는 방법

## 📝 라이선스

MIT

