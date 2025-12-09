# 🔄 SSO "한 번만 로그인" 상세 플로우

## 📱 실제 사용자 시나리오

### 상황: 2개의 웹 서비스

```
서비스 A: http://app-a.local:3000
서비스 B: http://app-b.local:4000
Keycloak: http://localhost:8080
```

---

## 🎬 시나리오: 서비스 A → 서비스 B 이동

### 1단계: 서비스 A에서 로그인

```
사용자: 서비스 A 접속
  http://app-a.local:3000

서비스 A: "로그인 필요"
  → "SSO 로그인" 버튼 표시

사용자: "SSO 로그인" 버튼 클릭
  → GET /api/sso/login 호출

서버: Keycloak으로 리다이렉트
  → http://localhost:8080/realms/my-realm/protocol/openid-connect/auth

사용자: Keycloak 로그인 페이지에서 로그인
  - Email: user@example.com
  - Password: password123

Keycloak: 인증 성공
  → 세션 생성 ✅
  → 쿠키에 세션 정보 저장
  → http://app-a.local:3000/api/sso/callback?code=xxx 로 리다이렉트

서버: 콜백 처리
  → MongoDB 동기화
  → JWT 토큰 발급

서비스 A: 로그인 완료 ✅
```

---

### 2단계: 서비스 B로 이동

#### 시나리오 A: 보호된 페이지 접근 (자동 체크)

```
사용자: 서비스 B의 보호된 페이지 접근
  http://app-b.local:4000/dashboard

서비스 B (프론트엔드):
  // 보호된 라우트에서 자동으로 인증 체크
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      // 토큰 없으면 → SSO 로그인으로 자동 리다이렉트
      window.location.href = '/api/sso/login';
    }
  }, []);

서버: GET /api/sso/login
  → Keycloak으로 리다이렉트

Keycloak: 세션 확인
  → "이미 로그인되어 있네!" ✅
  → 로그인 화면 안 뜸
  → 바로 토큰 발급
  → http://app-b.local:4000/api/sso/callback?code=xxx

서버: 콜백 처리
  → MongoDB 동기화
  → JWT 토큰 발급

서비스 B: 자동 로그인 완료 ✅
  (로그인 화면 안 보임!)
```

#### 시나리오 B: 로그인 페이지 접근 (버튼 클릭)

```
사용자: 서비스 B의 로그인 페이지 접근
  http://app-b.local:4000/login

서비스 B: 로그인 페이지 표시
  → "SSO 로그인" 버튼 표시

사용자: "SSO 로그인" 버튼 클릭
  → GET /api/sso/login 호출

Keycloak: 세션 확인
  → 이미 로그인됨 ✅
  → 로그인 화면 안 뜸
  → 바로 토큰 발급

서비스 B: 로그인 완료 ✅
```

---

## 🔍 핵심: Keycloak 세션 확인

### Keycloak이 하는 일

```
GET /api/sso/login 요청
    ↓
Keycloak으로 리다이렉트
    ↓
Keycloak: 쿠키 확인
    ├─ 세션 있음? → 바로 토큰 발급 ✅ (로그인 화면 안 뜸)
    └─ 세션 없음? → 로그인 화면 표시
```

---

## 📊 플로우 비교

### 첫 번째 서비스 (서비스 A)

```
1. 사용자: "SSO 로그인" 클릭
2. Keycloak: 세션 없음 → 로그인 화면 표시
3. 사용자: 로그인
4. Keycloak: 세션 생성 ✅
5. 서비스 A: 로그인 완료
```

### 두 번째 서비스 (서비스 B)

```
1. 사용자: 서비스 B 접속
2. 서비스 B: 자동으로 /api/sso/login 호출
   (또는 버튼 클릭)
3. Keycloak: 세션 확인
   → "이미 로그인되어 있네!" ✅
4. Keycloak: 로그인 화면 안 뜸
   → 바로 토큰 발급
5. 서비스 B: 자동 로그인 완료 ✅
```

---

## 💻 프론트엔드 구현 예시

### 예시 1: 보호된 페이지 (자동 체크)

```javascript
// ProtectedRoute.js 또는 Dashboard.js
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    // 토큰 없으면 → SSO 로그인으로 자동 리다이렉트
    window.location.href = '/api/sso/login';
  }
}, []);

// 사용자가 아무것도 안 해도 자동으로 체크됨
```

### 예시 2: 로그인 페이지 (버튼 클릭)

```javascript
// LoginPage.js
const handleSsoLogin = () => {
  // 사용자가 버튼을 클릭해야 함
  window.location.href = '/api/sso/login';
};

return (
  <div>
    <h2>로그인</h2>
    <button onClick={handleSsoLogin}>
      SSO 로그인
    </button>
  </div>
);
```

---

## 🎯 실제 동작

### 시나리오 1: 보호된 페이지 접근 (자동)

```
시간: 10:00
서비스 A 접속 → SSO 로그인 → 로그인 완료 ✅

시간: 10:05
서비스 B의 보호된 페이지 접근
  http://app-b.local:4000/dashboard
  
  → 페이지 로드 시 자동으로 토큰 체크
  → 토큰 없음 → 자동으로 /api/sso/login 호출
  → Keycloak: 세션 확인 → 바로 토큰 발급
  → 로그인 화면 안 뜸
  → 자동 로그인 완료 ✅
  
사용자: 아무것도 안 해도 자동 로그인!
```

### 시나리오 2: 로그인 페이지 접근 (버튼 클릭)

```
시간: 10:00
서비스 A 접속 → "SSO 로그인" 클릭 → 로그인 완료 ✅

시간: 10:05
서비스 B의 로그인 페이지 접근
  http://app-b.local:4000/login
  
  → 로그인 페이지 표시
  → "SSO 로그인" 버튼 표시
  
  → 사용자: 버튼 클릭 필요!
  → GET /api/sso/login 호출
  → Keycloak: 세션 확인 → 바로 토큰 발급
  → 로그인 화면 안 뜸
  → 로그인 완료 ✅
  
사용자: 버튼을 클릭해야 함!
```

---

## 🔑 핵심 포인트

### 1. Keycloak 세션 (쿠키)

```
Keycloak 로그인 성공 시:
  → 브라우저에 쿠키 저장
  → 도메인: localhost:8080
  → 모든 서비스에서 공유 가능
```

### 2. 자동 vs 수동

| 방식 | 페이지 타입 | 동작 | 사용자 행동 |
|------|-----------|------|------------|
| **자동** | 보호된 페이지 (예: /dashboard) | 페이지 로드 시 자동 체크 | 아무것도 안 해도 됨 ✅ |
| **수동** | 로그인 페이지 (예: /login) | 버튼 클릭 필요 | 버튼 클릭 필요 |

### 3. 로그인 화면 표시 여부

```
첫 번째 서비스:
  → 세션 없음
  → 로그인 화면 표시 ✅

두 번째 서비스:
  → 세션 있음
  → 로그인 화면 안 뜸 ✅
  → 바로 토큰 발급
```

---

## 📝 요약

**질문: 서비스 B로 이동하면 버튼을 눌러야 하나요?**

**답변: 페이지 타입에 따라 다릅니다!**

### 보호된 페이지 접근 시 (자동)
```
예: /dashboard, /profile, /settings
→ 토큰 없으면 자동으로 /api/sso/login 호출
→ 사용자: 아무것도 안 해도 자동 로그인 ✅
```

### 로그인 페이지 접근 시 (버튼 클릭)
```
예: /login
→ "SSO 로그인" 버튼 표시
→ 사용자: 버튼 클릭 필요 ✅
```

**핵심:**
- **보호된 페이지**: 자동 체크 → 버튼 불필요
- **로그인 페이지**: 버튼 클릭 필요

**공통점:**
- 두 경우 모두 Keycloak이 세션을 확인
- 세션이 있으면 로그인 화면 안 뜸
- 바로 토큰 발급하여 로그인 완료

