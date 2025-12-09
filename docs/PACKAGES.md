# 📦 패키지 설명서

이 프로젝트에서 사용하는 npm 패키지들에 대한 설명입니다.

---

## 🏭 Production Dependencies

### 1. express `^4.18.2`

**Node.js 웹 프레임워크**

가장 널리 사용되는 Node.js 웹 애플리케이션 프레임워크입니다. 라우팅, 미들웨어, HTTP 요청/응답 처리 등을 담당합니다.

```javascript
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

📚 [공식 문서](https://expressjs.com/)

---

### 2. mongoose `^8.0.3`

**MongoDB ODM (Object Document Mapper)**

MongoDB와 Node.js를 연결하고, 스키마 기반의 데이터 모델링을 제공합니다.

```javascript
const mongoose = require('mongoose');

// 스키마 정의
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: String,
});

// 모델 생성
const User = mongoose.model('User', userSchema);

// 데이터 저장
const user = await User.create({ email: 'test@test.com', name: '홍길동' });
```

📚 [공식 문서](https://mongoosejs.com/)

---

### 3. bcrypt `^5.1.1`

**비밀번호 해싱 라이브러리**

비밀번호를 안전하게 해싱하고 검증하는 라이브러리입니다. Salt를 자동으로 생성하여 Rainbow Table 공격을 방지합니다.

```javascript
const bcrypt = require('bcrypt');

// 비밀번호 해싱
const saltRounds = 12;
const hashedPassword = await bcrypt.hash('myPassword123', saltRounds);
// 결과: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S...

// 비밀번호 검증
const isMatch = await bcrypt.compare('myPassword123', hashedPassword);
// 결과: true
```

| Salt Rounds | 해싱 시간 | 용도 |
|-------------|----------|------|
| 10 | ~100ms | 개발/테스트 |
| 12 | ~300ms | 프로덕션 (권장) |
| 14 | ~1s | 고보안 |

📚 [GitHub](https://github.com/kelektiv/node.bcrypt.js)

---

### 4. jsonwebtoken `^9.0.2`

**JWT (JSON Web Token) 라이브러리**

토큰 기반 인증을 위한 JWT 생성 및 검증 라이브러리입니다.

```javascript
const jwt = require('jsonwebtoken');

// 토큰 생성
const token = jwt.sign(
  { userId: '123', email: 'user@test.com' },  // payload
  'your-secret-key',                           // secret
  { expiresIn: '15m' }                         // options
);

// 토큰 검증
const decoded = jwt.verify(token, 'your-secret-key');
// 결과: { userId: '123', email: 'user@test.com', iat: ..., exp: ... }

// 토큰 디코딩 (검증 없이)
const payload = jwt.decode(token);
```

📚 [GitHub](https://github.com/auth0/node-jsonwebtoken)

---

### 5. dotenv `^16.3.1`

**환경 변수 관리**

`.env` 파일에서 환경 변수를 로드하여 `process.env`에 주입합니다.

```bash
# .env 파일
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mydb
JWT_SECRET=my-secret-key
```

```javascript
require('dotenv').config();

console.log(process.env.PORT);        // 3000
console.log(process.env.JWT_SECRET);  // my-secret-key
```

📚 [GitHub](https://github.com/motdotla/dotenv)

---

### 6. cors `^2.8.5`

**Cross-Origin Resource Sharing 미들웨어**

다른 도메인에서의 API 요청을 허용/제한하는 CORS 정책을 설정합니다.

```javascript
const cors = require('cors');

// 모든 도메인 허용
app.use(cors());

// 특정 도메인만 허용
app.use(cors({
  origin: ['https://myapp.com', 'http://localhost:3000'],
  credentials: true,  // 쿠키 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

📚 [GitHub](https://github.com/expressjs/cors)

---

### 7. helmet `^7.1.0`

**보안 HTTP 헤더 설정**

다양한 보안 관련 HTTP 헤더를 자동으로 설정하여 일반적인 웹 취약점을 방지합니다.

```javascript
const helmet = require('helmet');

app.use(helmet());
```

**설정되는 주요 헤더:**

| 헤더 | 설명 |
|------|------|
| `X-Content-Type-Options` | MIME 스니핑 방지 |
| `X-Frame-Options` | 클릭재킹 방지 |
| `X-XSS-Protection` | XSS 필터 활성화 |
| `Strict-Transport-Security` | HTTPS 강제 |
| `Content-Security-Policy` | 리소스 로드 제한 |

📚 [GitHub](https://github.com/helmetjs/helmet)

---

### 8. express-rate-limit `^7.1.5`

**요청 제한 (Rate Limiting)**

특정 시간 내 요청 횟수를 제한하여 DDoS, 브루트포스 공격을 방지합니다.

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                   // 최대 100회
  message: { error: '너무 많은 요청입니다.' },
  standardHeaders: true,      // RateLimit-* 헤더 포함
});

app.use('/api/', limiter);

// 로그인 전용 (더 엄격하게)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 15분에 5회만
  skipSuccessfulRequests: true,  // 성공한 요청은 카운트 안 함
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

📚 [GitHub](https://github.com/express-rate-limit/express-rate-limit)

---

### 9. express-validator `^7.0.1`

**요청 데이터 유효성 검사**

Express 요청의 body, query, params 등을 검증하고 sanitize합니다.

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register',
  // 유효성 검사 규칙
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  
  // 핸들러
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 회원가입 처리...
  }
);
```

**자주 사용하는 검증 메서드:**

| 메서드 | 설명 |
|--------|------|
| `isEmail()` | 이메일 형식 검증 |
| `isLength({ min, max })` | 길이 검증 |
| `notEmpty()` | 빈 값 검증 |
| `isInt()`, `isFloat()` | 숫자 검증 |
| `matches(/regex/)` | 정규식 검증 |
| `trim()` | 앞뒤 공백 제거 |
| `normalizeEmail()` | 이메일 정규화 |
| `escape()` | HTML 이스케이프 |

📚 [공식 문서](https://express-validator.github.io/)

---

### 10. morgan `^1.10.0`

**HTTP 요청 로깅**

들어오는 HTTP 요청을 콘솔에 로깅합니다.

```javascript
const morgan = require('morgan');

// 개발 환경 - 컬러풀한 간단한 로그
app.use(morgan('dev'));
// 출력: GET /api/users 200 12.345 ms - 256

// 프로덕션 - 상세 로그
app.use(morgan('combined'));
// 출력: ::1 - - [10/Jan/2024:10:00:00 +0000] "GET /api/users HTTP/1.1" 200 256
```

**로그 포맷:**

| 포맷 | 설명 |
|------|------|
| `dev` | 개발용, 컬러 상태 코드 |
| `combined` | Apache 표준 로그 포맷 |
| `common` | Apache common 로그 포맷 |
| `short` | 짧은 로그 |
| `tiny` | 최소 로그 |

📚 [GitHub](https://github.com/expressjs/morgan)

---

### 11. swagger-jsdoc `^6.2.8`

**Swagger/OpenAPI 문서 생성**

JSDoc 주석에서 OpenAPI(Swagger) 스펙을 자동 생성합니다.

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'],  // JSDoc 주석이 있는 파일들
};

const swaggerSpec = swaggerJsdoc(options);
```

```javascript
// routes/users.js
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 사용자 목록 조회
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/users', getUsers);
```

📚 [GitHub](https://github.com/Surnet/swagger-jsdoc)

---

### 12. swagger-ui-express `^5.0.0`

**Swagger UI 서빙**

생성된 OpenAPI 스펙을 시각적인 웹 UI로 제공합니다.

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'My API Docs',
}));
```

📚 [GitHub](https://github.com/scottie1984/swagger-ui-express)

---

## 🛠️ Development Dependencies

### nodemon `^3.0.2`

**자동 서버 재시작**

파일 변경을 감지하여 Node.js 서버를 자동으로 재시작합니다.

```bash
# 직접 실행
npx nodemon server.js

# package.json scripts
"scripts": {
  "dev": "nodemon server.js"
}
```

```bash
# nodemon.json으로 설정 커스터마이징
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "delay": 1000
}
```

📚 [공식 사이트](https://nodemon.io/)

---

## 📊 패키지 요약

| 패키지 | 카테고리 | 역할 |
|--------|----------|------|
| express | 프레임워크 | 웹 서버 |
| mongoose | 데이터베이스 | MongoDB ODM |
| bcrypt | 보안 | 비밀번호 해싱 |
| jsonwebtoken | 인증 | JWT 토큰 |
| dotenv | 설정 | 환경 변수 |
| cors | 보안 | CORS 정책 |
| helmet | 보안 | HTTP 헤더 |
| express-rate-limit | 보안 | 요청 제한 |
| express-validator | 유효성 검사 | 입력값 검증 |
| morgan | 로깅 | HTTP 로그 |
| swagger-jsdoc | 문서화 | API 스펙 생성 |
| swagger-ui-express | 문서화 | Swagger UI |
| nodemon | 개발 도구 | 자동 재시작 |

---

## 🔗 유용한 링크

- [Express.js 가이드](https://expressjs.com/en/guide/routing.html)
- [Mongoose 가이드](https://mongoosejs.com/docs/guide.html)
- [JWT 소개](https://jwt.io/introduction)
- [OWASP 보안 가이드](https://owasp.org/www-project-web-security-testing-guide/)

