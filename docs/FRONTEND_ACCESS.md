# 🌐 프론트엔드 페이지 접속 방법

## 빠른 시작

### 1단계: 서버 실행

```bash
cd backend
npm start
```

**또는 개발 모드:**
```bash
npm run dev
```

### 2단계: 브라우저에서 접속

서버가 실행되면 다음 URL로 접속하세요:

| 페이지 | URL | 설명 |
|--------|-----|------|
| **메인 페이지** | `http://localhost:4000/` | 회원가입, 로그인, 내 정보 |
| **2FA 설정** | `http://localhost:4000/2fa-setup.html` | 2단계 인증 설정 |
| **Passkey 테스트** | `http://localhost:4000/passkey.html` | Passkey 등록/로그인 |
| **Swagger API** | `http://localhost:4000/api-docs` | API 문서 |

---

## 접속 방법 상세

### 방법 1: 직접 URL 입력

브라우저 주소창에 입력:
```
http://localhost:4000/
```

### 방법 2: 서버 콘솔 확인

서버 실행 시 콘솔에 표시되는 URL:
```
🚀 ========================================
   서버가 포트 4000에서 실행 중입니다
🚀 ========================================

   📌 환경: development
   📌 프론트엔드: http://localhost:4000/    ← 여기!
   📌 API: http://localhost:4000/api
   📌 Swagger: http://localhost:4000/api-docs
   📌 Health: http://localhost:4000/health
```

---

## 페이지별 접속 URL

### 메인 페이지 (index.html)
```
http://localhost:4000/
```
또는
```
http://localhost:4000/index.html
```

**기능:**
- 회원가입
- 로그인
- 내 정보 조회/수정
- 2FA 설정 링크

---

### 2FA 설정 페이지
```
http://localhost:4000/2fa-setup.html
```

**기능:**
- QR 코드 표시
- OTP 코드 검증
- 백업 코드 표시

---

### Passkey 테스트 페이지
```
http://localhost:4000/passkey.html
```

**기능:**
- Passkey 등록
- Passkey 로그인

---

## 포트 변경 시

`.env` 파일에서 포트를 변경한 경우:

```env
PORT=3000
```

접속 URL도 변경:
```
http://localhost:3000/
```

---

## 문제 해결

### 1. 페이지가 안 열릴 때

**확인 사항:**
- ✅ 서버가 실행 중인가?
- ✅ 포트 번호가 맞는가?
- ✅ `backend/public/` 폴더에 HTML 파일이 있는가?

**해결:**
```bash
# 서버 재시작
cd backend
npm start
```

---

### 2. CORS 에러가 발생할 때

**원인:** 다른 포트에서 접속하려고 할 때

**해결:** `.env` 파일에서 CORS 설정 확인
```env
CORS_ORIGIN=http://localhost:4000
```

---

### 3. 정적 파일이 안 보일 때

**확인:** `backend/src/app.js`에 다음 코드가 있는지 확인
```javascript
app.use(express.static('public'));
```

---

## 개발 팁

### 1. 파일 수정 후 즉시 반영

HTML 파일을 수정하면:
- **서버 재시작 불필요** ✅
- 브라우저 새로고침만 하면 됨 (F5 또는 Cmd+R)

### 2. 개발자 도구 활용

브라우저 개발자 도구 (F12):
- 콘솔에서 에러 확인
- Network 탭에서 API 호출 확인
- Application 탭에서 localStorage 확인

### 3. 여러 브라우저에서 테스트

- Chrome: `http://localhost:4000/`
- Firefox: `http://localhost:4000/`
- Safari: `http://localhost:4000/`

각 브라우저는 독립적인 세션을 가집니다.

---

## 요약

1. **서버 실행**: `cd backend && npm start`
2. **브라우저 접속**: `http://localhost:4000/`
3. **끝!** 🎉

---

**지금 바로 시도해보세요!** 🚀

