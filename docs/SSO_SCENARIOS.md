# 🔄 SSO 활성화/비활성화 시나리오 비교

## 📋 시나리오 개요

| 항목 | SSO 비활성화 | SSO 활성화 |
|------|-------------|-----------|
| **회원가입** | MongoDB 저장 | Keycloak 저장 |
| **로그인** | 일반 JWT | SSO (Keycloak) |
| **사용자 저장소** | MongoDB | Keycloak (중앙) |
| **다중 서비스** | ❌ 불가 | ✅ 가능 |

---

## 🚫 시나리오 1: SSO 비활성화 (`SSO_ENABLED=false`)

### 1-1. 회원가입

```
사용자 요청:
  POST /api/auth/register
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동"
  }

서버 처리:
  1. MongoDB 중복 확인
  2. MongoDB에 사용자 저장 ✅
  3. JWT 토큰 발급

결과:
  {
    "success": true,
    "data": {
      "user": {...},
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
```

**저장 위치:**
- ✅ MongoDB: 저장됨
- ❌ Keycloak: 저장 안 됨

---

### 1-2. 로그인

```
사용자 요청:
  POST /api/auth/login
  {
    "email": "user@example.com",
    "password": "password123"
  }

서버 처리:
  1. MongoDB에서 사용자 조회
  2. 비밀번호 검증 (bcrypt)
  3. JWT 토큰 발급

결과:
  {
    "success": true,
    "data": {
      "user": {...},
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
```

**인증 방식:**
- ✅ MongoDB 비밀번호 검증
- ❌ Keycloak 사용 안 함

---

### 1-3. SSO 로그인 시도

```
사용자 요청:
  GET /api/sso/login

서버 응답:
  {
    "success": false,
    "message": "SSO가 비활성화되어 있습니다",
    "code": "SSO_DISABLED"
  }
```

**결과:** SSO 로그인 불가 ❌

---

### 1-4. 여러 서비스 접속

```
서비스 A 접속:
  POST /api/auth/login → 로그인 ✅

서비스 B 접속:
  POST /api/auth/login → 다시 로그인 필요 ❌
```

**결과:** 각 서비스마다 별도 로그인 필요

---

## ✅ 시나리오 2: SSO 활성화 (`SSO_ENABLED=true`)

### 2-1. 회원가입

```
사용자 요청:
  POST /api/auth/register
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동"
  }

서버 처리:
  1. Keycloak 중복 확인
  2. Keycloak Admin API로 사용자 생성 ✅
  3. MongoDB는 저장하지 않음 ❌

결과:
  {
    "success": true,
    "message": "회원가입이 완료되었습니다. SSO 로그인을 진행해주세요.",
    "data": {
      "message": "Keycloak에 등록되었습니다. /api/sso/login으로 로그인하세요.",
      "loginUrl": "/api/sso/login"
    }
  }
```

**저장 위치:**
- ✅ Keycloak: 저장됨
- ❌ MongoDB: 저장 안 됨 (SSO 로그인 시 자동 생성)

---

### 2-2. SSO 로그인 (첫 로그인)

```
1단계: SSO 로그인 시작
  GET /api/sso/login
    ↓
  Keycloak 로그인 페이지로 리다이렉트
  http://localhost:8080/realms/my-realm/protocol/openid-connect/auth

2단계: Keycloak에서 로그인
  사용자 입력:
    - Email: user@example.com
    - Password: password123
    ↓
  Keycloak 인증 성공

3단계: 콜백 처리
  GET /api/sso/callback
    ↓
  서버 처리:
    1. Keycloak에서 사용자 정보 받음
    2. MongoDB에서 사용자 찾기
    3. 없음! → MongoDB에 자동 생성 ✅
       {
         email: "user@example.com",
         name: "홍길동",
         ssoId: "keycloak-user-id",
         ssoProvider: "keycloak",
         password: null
       }
    4. JWT 토큰 발급

결과:
  {
    "success": true,
    "data": {
      "user": {...},
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
```

**저장 위치:**
- ✅ Keycloak: 이미 있음
- ✅ MongoDB: 자동 생성됨

---

### 2-3. 일반 로그인 시도

```
사용자 요청:
  POST /api/auth/login
  {
    "email": "user@example.com",
    "password": "password123"
  }

서버 처리:
  1. MongoDB에서 사용자 조회
  2. 사용자 찾음 (SSO 로그인 시 생성됨)
  3. 비밀번호 검증 시도
  4. password: null → 검증 실패 ❌

결과:
  {
    "success": false,
    "message": "이메일 또는 비밀번호가 올바르지 않습니다"
  }
```

**결과:** 일반 로그인 불가 (SSO 사용자는 비밀번호 없음)

---

### 2-4. 여러 서비스 접속 (SSO 마법)

```
서비스 A 접속:
  GET /api/sso/login
    ↓
  Keycloak 로그인 페이지
    ↓
  로그인 성공
    ↓
  서비스 A 로그인 완료 ✅

서비스 B 접속:
  GET /api/sso/login
    ↓
  Keycloak: "이미 로그인되어 있네!" ⚡
    ↓
  로그인 화면 안 뜸
    ↓
  바로 서비스 B 로그인 완료 ✅
```

**결과:** 한 번 로그인으로 모든 서비스 접근 가능 (SSO)

---

## 📊 비교표

### 회원가입

| 항목 | SSO 비활성화 | SSO 활성화 |
|------|-------------|-----------|
| **엔드포인트** | `POST /api/auth/register` | `POST /api/auth/register` |
| **저장 위치** | MongoDB | Keycloak |
| **즉시 로그인** | ✅ 가능 (JWT 발급) | ❌ 불가 (SSO 로그인 필요) |
| **응답** | JWT 토큰 포함 | "SSO 로그인하세요" 메시지 |

---

### 로그인

| 항목 | SSO 비활성화 | SSO 활성화 |
|------|-------------|-----------|
| **일반 로그인** | `POST /api/auth/login` ✅ | `POST /api/auth/login` ⚠️ (SSO 사용자 불가) |
| **SSO 로그인** | `GET /api/sso/login` ❌ | `GET /api/sso/login` ✅ |
| **인증 방식** | MongoDB 비밀번호 | Keycloak SSO |
| **MongoDB 동기화** | 불필요 (이미 있음) | 자동 생성 |

---

### 다중 서비스

| 항목 | SSO 비활성화 | SSO 활성화 |
|------|-------------|-----------|
| **서비스 A 로그인** | 필요 | 필요 |
| **서비스 B 접속** | 다시 로그인 필요 ❌ | 자동 로그인 ✅ |
| **세션 공유** | ❌ 불가 | ✅ Keycloak 세션 |

---

## 🎯 실제 사용 예시

### SSO 비활성화 시

```
1. 회원가입
   POST /api/auth/register
   → MongoDB 저장
   → JWT 토큰 즉시 발급 ✅

2. 로그인
   POST /api/auth/login
   → MongoDB 검증
   → JWT 토큰 발급 ✅

3. 다른 서비스 접속
   → 다시 로그인 필요 ❌
```

---

### SSO 활성화 시

```
1. 회원가입
   POST /api/auth/register
   → Keycloak 저장
   → "SSO 로그인하세요" 메시지

2. SSO 로그인
   GET /api/sso/login
   → Keycloak 로그인
   → MongoDB 자동 생성
   → JWT 토큰 발급 ✅

3. 다른 서비스 접속
   GET /api/sso/login
   → Keycloak 세션 확인
   → 자동 로그인 ✅ (SSO 마법!)
```

---

## ⚠️ 주의사항

### SSO 활성화 시

1. **일반 로그인 제한**
   - SSO로 가입한 사용자는 일반 로그인 불가
   - 비밀번호가 없기 때문

2. **회원가입 후 즉시 로그인 불가**
   - Keycloak에만 저장
   - SSO 로그인 필요

3. **Keycloak 의존성**
   - Keycloak 다운 시 회원가입/로그인 불가

---

## 🔄 전환 시나리오

### SSO 비활성화 → 활성화

```
기존 사용자:
  - MongoDB에 있음 ✅
  - 일반 로그인 가능 ✅

새 사용자:
  - Keycloak에만 저장
  - SSO 로그인 필요
```

### SSO 활성화 → 비활성화

```
기존 SSO 사용자:
  - Keycloak에 있음
  - MongoDB에도 있음 (SSO 로그인 시 생성됨)
  - 일반 로그인 불가 (비밀번호 없음) ❌

해결책:
  - 비밀번호 재설정 필요
  - 또는 SSO 유지
```

---

## 📝 요약

| 상황 | SSO 비활성화 | SSO 활성화 |
|------|-------------|-----------|
| **회원가입 저장소** | MongoDB | Keycloak |
| **로그인 방식** | 일반 JWT | SSO |
| **다중 서비스** | 각각 로그인 | 한 번만 로그인 |
| **의존성** | MongoDB만 | Keycloak + MongoDB |

