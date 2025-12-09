# Node.js 인증 백엔드 설계 문서

## 📋 개요

JWT(JSON Web Token) 기반의 사용자 인증 시스템을 구현하는 Node.js 백엔드 서버입니다.

---

## 🏗️ 기술 스택

| 구분 | 기술 |
|------|------|
| **런타임** | Node.js (v18+) |
| **프레임워크** | Express.js |
| **데이터베이스** | MongoDB (Mongoose ODM) |
| **인증** | JWT (jsonwebtoken) |
| **비밀번호 암호화** | bcrypt |
| **유효성 검사** | express-validator |
| **환경 변수** | dotenv |

---

## 📁 프로젝트 구조

```
nodejs-auth/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB 연결 설정
│   ├── controllers/
│   │   └── authController.js  # 인증 관련 컨트롤러
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT 검증 미들웨어
│   │   └── errorHandler.js    # 에러 핸들링 미들웨어
│   ├── models/
│   │   └── User.js            # 사용자 모델
│   ├── routes/
│   │   └── authRoutes.js      # 인증 라우트
│   ├── utils/
│   │   ├── jwtUtils.js        # JWT 유틸리티
│   │   └── passwordUtils.js   # 비밀번호 유틸리티
│   └── app.js                 # Express 앱 설정
├── .env                       # 환경 변수
├── .env.example               # 환경 변수 예시
├── package.json
└── server.js                  # 서버 진입점
```

---

## 🔐 API 엔드포인트

### 1. 회원가입

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "홍길동"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. 로그인

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "홍길동"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

---

### 3. 로그아웃

```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "로그아웃 되었습니다."
}
```

---

### 4. 토큰 갱신

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 5. 내 정보 조회

```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "홍길동",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 6. 비밀번호 변경

```
PUT /api/auth/password
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다."
}
```

---

## 🔒 비밀번호 암호화

### bcrypt 해싱 전략

```javascript
// 비밀번호 해싱
const SALT_ROUNDS = 12;

// 해싱 (회원가입/비밀번호 변경 시)
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// 검증 (로그인 시)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Salt Rounds 선택 기준

| Salt Rounds | 대략적인 해싱 시간 | 권장 용도 |
|-------------|-------------------|----------|
| 10 | ~100ms | 개발/테스트 환경 |
| 12 | ~300ms | 일반 프로덕션 |
| 14 | ~1s | 고보안 요구사항 |

---

## 🎫 JWT 토큰 구조

### Access Token
- **만료 시간:** 15분
- **용도:** API 요청 인증
- **저장 위치:** 메모리 (클라이언트)

### Refresh Token
- **만료 시간:** 7일
- **용도:** Access Token 갱신
- **저장 위치:** HttpOnly Cookie 또는 안전한 저장소

### Token Payload 구조

```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "type": "access",  // 또는 "refresh"
  "iat": 1704067200,
  "exp": 1704068100
}
```

---

## 👤 User 모델

```javascript
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

---

## 🛡️ 보안 고려사항

### 1. 비밀번호 정책
- 최소 8자 이상
- 대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함 권장
- 일반적인 패턴(123456, password 등) 차단

### 2. Rate Limiting
```javascript
// 로그인 시도 제한
- 5회 실패 시 5분 잠금
- IP 기반 + 계정 기반 이중 제한
```

### 3. CORS 설정
```javascript
const corsOptions = {
  origin: ['https://example.com'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 4. 헤더 보안 (Helmet)
```javascript
app.use(helmet());
```

### 5. SQL Injection / NoSQL Injection 방지
- Mongoose 스키마 타입 검증
- 입력값 sanitization

---

## 🔄 인증 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        회원가입 플로우                           │
├─────────────────────────────────────────────────────────────────┤
│  1. 클라이언트 → 서버: POST /register (email, password, name)   │
│  2. 서버: 이메일 중복 확인                                       │
│  3. 서버: 비밀번호 bcrypt 해싱 (salt rounds: 12)                │
│  4. 서버: DB에 사용자 저장                                       │
│  5. 서버: JWT Access/Refresh Token 생성                         │
│  6. 서버 → 클라이언트: 토큰 + 사용자 정보 반환                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        로그인 플로우                             │
├─────────────────────────────────────────────────────────────────┤
│  1. 클라이언트 → 서버: POST /login (email, password)            │
│  2. 서버: 이메일로 사용자 조회                                   │
│  3. 서버: bcrypt.compare()로 비밀번호 검증                       │
│  4. 서버: JWT Access/Refresh Token 생성                         │
│  5. 서버: Refresh Token DB에 저장                               │
│  6. 서버 → 클라이언트: 토큰 + 사용자 정보 반환                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      인증된 요청 플로우                          │
├─────────────────────────────────────────────────────────────────┤
│  1. 클라이언트 → 서버: API 요청 + Authorization 헤더            │
│  2. 서버: JWT 검증 미들웨어                                      │
│  3. 서버: 토큰 유효성 + 만료 확인                                │
│  4. 서버: req.user에 사용자 정보 첨부                            │
│  5. 서버: 요청 처리 및 응답                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      토큰 갱신 플로우                            │
├─────────────────────────────────────────────────────────────────┤
│  1. 클라이언트: Access Token 만료 감지                           │
│  2. 클라이언트 → 서버: POST /refresh (refreshToken)             │
│  3. 서버: Refresh Token 검증                                     │
│  4. 서버: DB에 저장된 Refresh Token과 비교                       │
│  5. 서버: 새 Access/Refresh Token 생성                          │
│  6. 서버: 새 Refresh Token DB 업데이트                          │
│  7. 서버 → 클라이언트: 새 토큰 반환                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 에러 코드 정의

| HTTP 상태 | 코드 | 설명 |
|-----------|------|------|
| 400 | VALIDATION_ERROR | 입력값 유효성 검사 실패 |
| 401 | INVALID_CREDENTIALS | 이메일/비밀번호 불일치 |
| 401 | TOKEN_EXPIRED | 토큰 만료 |
| 401 | INVALID_TOKEN | 유효하지 않은 토큰 |
| 403 | ACCOUNT_DISABLED | 비활성화된 계정 |
| 409 | EMAIL_EXISTS | 이미 등록된 이메일 |
| 429 | TOO_MANY_REQUESTS | 요청 횟수 초과 |
| 500 | SERVER_ERROR | 서버 내부 오류 |

---

## 📦 환경 변수 (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nodejs-auth

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 실행
npm start
```

---

## 📝 다음 단계

1. [ ] 기본 프로젝트 구조 생성
2. [ ] User 모델 구현
3. [ ] 비밀번호 유틸리티 구현
4. [ ] JWT 유틸리티 구현
5. [ ] 인증 컨트롤러 구현
6. [ ] 인증 미들웨어 구현
7. [ ] 라우트 설정
8. [ ] 에러 핸들링 구현
9. [ ] 테스트 코드 작성

