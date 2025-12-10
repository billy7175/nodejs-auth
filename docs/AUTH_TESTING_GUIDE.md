# 🧪 Main 브랜치 인증 기능 테스트 가이드

> SSO 브랜치에서 SSO를 구현했으니, 이제 main 브랜치에서 다른 인증 기능들을 테스트해볼 수 있습니다.

---

## 📊 현재 상태

### ✅ 구현 완료 (main 브랜치)
- 기본 JWT 인증
- 회원가입/로그인
- 토큰 갱신
- 비밀번호 변경
- 계정 관리

### 🚧 구현 가능한 기능들

---

## 🎯 추천 구현 순서

### Phase 1: 기본 강화 (우선 구현 권장)

#### 1️⃣ TOTP 기반 2FA (2단계 인증)
**난이도:** ⭐⭐ (쉬움)  
**보안 수준:** ⭐⭐⭐⭐  
**구현 시간:** 2-3시간

**특징:**
- Google Authenticator, Authy 앱과 호환
- QR 코드 스캔으로 간편 설정
- 비밀번호 + OTP 코드로 이중 보안

**필요 라이브러리:**
```bash
npm install speakeasy qrcode
```

**API 엔드포인트:**
```
POST /api/auth/2fa/setup      # 2FA 설정 (QR 코드 생성)
POST /api/auth/2fa/verify      # OTP 검증 및 활성화
POST /api/auth/2fa/disable     # 2FA 비활성화
POST /api/auth/login/2fa       # 2FA 로그인 (OTP 입력)
```

**테스트 방법:**
1. `/api/auth/2fa/setup` 호출 → QR 코드 받기
2. Google Authenticator로 QR 스캔
3. 생성된 6자리 코드로 `/api/auth/2fa/verify` 호출
4. 로그인 시 `/api/auth/login/2fa` 사용

---

#### 2️⃣ 이메일 인증 (회원가입/비밀번호 재설정)
**난이도:** ⭐⭐ (쉬움)  
**보안 수준:** ⭐⭐⭐  
**구현 시간:** 1-2시간

**특징:**
- 회원가입 시 이메일 인증 필수
- 비밀번호 재설정 링크 발송
- 이메일 인증 코드 발송

**필요 라이브러리:**
```bash
npm install nodemailer
```

**API 엔드포인트:**
```
POST /api/auth/email/send-verification    # 인증 이메일 발송
GET  /api/auth/email/verify?token=xxx      # 이메일 인증 완료
POST /api/auth/password/reset-request      # 비밀번호 재설정 요청
POST /api/auth/password/reset              # 비밀번호 재설정
```

**테스트 방법:**
1. 회원가입 후 이메일 확인
2. 이메일 링크 클릭하여 인증 완료
3. 비밀번호 재설정 요청 → 이메일 링크로 재설정

---

#### 3️⃣ 활성 세션 관리
**난이도:** ⭐⭐⭐ (중간)  
**보안 수준:** ⭐⭐⭐⭐  
**구현 시간:** 2-3시간

**특징:**
- 모든 활성 세션 목록 조회
- 특정 기기에서 로그아웃
- 모든 기기에서 로그아웃 (현재 제외)
- 세션별 기기 정보, IP, 위치 표시

**필요 라이브러리:**
```bash
npm install ua-parser-js geoip-lite
```

**API 엔드포인트:**
```
GET    /api/auth/sessions              # 활성 세션 목록
DELETE /api/auth/sessions/:sessionId   # 특정 세션 종료
DELETE /api/auth/sessions              # 모든 세션 종료 (현재 제외)
```

**테스트 방법:**
1. 여러 기기/브라우저에서 로그인
2. `/api/auth/sessions`로 모든 세션 확인
3. 특정 세션 삭제하여 해당 기기에서 로그아웃

---

### Phase 2: 사용자 편의 (다음 단계)

#### 4️⃣ 소셜 로그인 (OAuth 2.0)
**난이도:** ⭐⭐⭐ (중간)  
**사용자 편의성:** ⭐⭐⭐⭐⭐  
**구현 시간:** 3-4시간

**지원 가능한 Provider:**
- Google (가장 쉬움)
- Kakao (한국 서비스 필수)
- Naver
- GitHub
- Apple

**필요 라이브러리:**
```bash
npm install passport passport-google-oauth20 passport-kakao
```

**API 엔드포인트:**
```
GET /api/auth/google              # Google 로그인 시작
GET /api/auth/google/callback     # Google 콜백 처리
GET /api/auth/kakao               # Kakao 로그인 시작
GET /api/auth/kakao/callback      # Kakao 콜백 처리
DELETE /api/auth/providers/:provider  # 소셜 계정 연동 해제
```

**테스트 방법:**
1. Google/Kakao 개발자 콘솔에서 앱 등록
2. OAuth 클라이언트 ID/Secret 설정
3. `/api/auth/google` 호출 → 로그인 페이지 리다이렉트
4. 로그인 후 JWT 토큰 발급

---

#### 5️⃣ 기기 관리 및 신뢰할 수 있는 기기
**난이도:** ⭐⭐⭐ (중간)  
**사용자 편의성:** ⭐⭐⭐⭐  
**구현 시간:** 2-3시간

**특징:**
- 신뢰 기기 등록 시 2FA 스킵
- 기기별 이름 지정
- 기기 목록 조회 및 삭제

**API 엔드포인트:**
```
GET    /api/auth/devices              # 등록된 기기 목록
POST   /api/auth/devices/trust        # 현재 기기 신뢰 등록
DELETE /api/auth/devices/:deviceId    # 신뢰 기기 해제
PUT    /api/auth/devices/:deviceId/name  # 기기 이름 변경
```

**테스트 방법:**
1. 로그인 후 현재 기기를 신뢰 기기로 등록
2. 다음 로그인 시 2FA 스킵 확인
3. 기기 목록에서 관리

---

#### 6️⃣ 매직 링크 (Passwordless)
**난이도:** ⭐⭐ (쉬움)  
**사용자 편의성:** ⭐⭐⭐⭐  
**구현 시간:** 1-2시간

**특징:**
- 비밀번호 없이 이메일 링크로 로그인
- 15분 유효 링크
- 일회용 토큰

**API 엔드포인트:**
```
POST /api/auth/magic-link/send        # 매직 링크 이메일 발송
GET  /api/auth/magic-link/verify      # 링크 검증 및 로그인
```

**테스트 방법:**
1. 이메일 주소 입력
2. 이메일로 받은 링크 클릭
3. 자동 로그인 및 JWT 발급

---

### Phase 3: 미래 대비 (고급)

#### 7️⃣ Passkey (WebAuthn/FIDO2)
**난이도:** ⭐⭐⭐⭐ (어려움)  
**보안 수준:** ⭐⭐⭐⭐⭐  
**구현 시간:** 4-6시간

**특징:**
- 비밀번호 없이 생체인식/보안 키로 로그인
- 피싱 방지
- 크로스 디바이스 지원

**필요 라이브러리:**
```bash
npm install @simplewebauthn/server
```

**API 엔드포인트:**
```
POST /api/auth/passkey/register/options   # 등록 옵션
POST /api/auth/passkey/register/verify    # 등록 완료
POST /api/auth/passkey/login/options      # 로그인 옵션
POST /api/auth/passkey/login/verify       # 로그인 완료
```

**테스트 방법:**
1. Passkey 등록 (지문/얼굴 인식)
2. 로그인 시 Passkey 사용
3. 여러 기기에서 동일 Passkey 사용

---

#### 8️⃣ SMS OTP 인증
**난이도:** ⭐⭐⭐ (중간)  
**보안 수준:** ⭐⭐⭐  
**구현 시간:** 2-3시간

**특징:**
- 휴대폰 번호로 OTP 발송
- 5분 유효 코드
- 시도 횟수 제한

**필요 라이브러리:**
```bash
npm install twilio
```

**API 엔드포인트:**
```
POST /api/auth/sms/send-otp         # SMS OTP 발송
POST /api/auth/sms/verify-otp        # OTP 검증
```

**테스트 방법:**
1. 휴대폰 번호 입력
2. SMS로 받은 6자리 코드 입력
3. 인증 완료

---

## 📋 구현 우선순위 추천

### 🥇 1순위: TOTP 2FA
**이유:**
- 보안 강화 효과가 큼
- 구현이 상대적으로 쉬움
- 사용자 경험 좋음 (QR 코드 스캔)
- 많은 서비스에서 필수 기능

### 🥈 2순위: 이메일 인증
**이유:**
- 회원가입 보안 강화
- 비밀번호 재설정 필수
- 구현이 간단함

### 🥉 3순위: 활성 세션 관리
**이유:**
- 보안 모니터링 필수
- 사용자 신뢰도 향상
- 계정 탈취 시 대응 가능

---

## 🚀 빠른 시작 가이드

### TOTP 2FA 구현 시작

```bash
# 1. main 브랜치로 전환
git checkout main

# 2. 필요한 패키지 설치
cd backend
npm install speakeasy qrcode

# 3. User 모델에 2FA 필드 추가
# - totpSecret (String)
# - is2FAEnabled (Boolean)
# - backupCodes (Array)

# 4. 2FA 라우트 및 컨트롤러 생성
# - routes/2faRoutes.js
# - controllers/2faController.js

# 5. Swagger 문서 추가
```

---

## 📊 기능별 비교표

| 기능 | 난이도 | 보안 | 편의성 | 구현 시간 | 우선순위 |
|------|--------|------|--------|----------|---------|
| **TOTP 2FA** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 2-3h | 🥇 |
| **이메일 인증** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 1-2h | 🥈 |
| **세션 관리** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 2-3h | 🥉 |
| **소셜 로그인** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3-4h | 4위 |
| **기기 관리** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2-3h | 5위 |
| **매직 링크** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 1-2h | 6위 |
| **Passkey** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 4-6h | 7위 |
| **SMS OTP** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2-3h | 8위 |

---

## 💡 테스트 시나리오 예시

### 시나리오 1: TOTP 2FA 활성화 → 로그인

```
1. 사용자 로그인
2. 2FA 설정 요청 → QR 코드 받기
3. Google Authenticator로 QR 스캔
4. 생성된 OTP 코드로 검증
5. 2FA 활성화 완료
6. 로그아웃
7. 다시 로그인 시도 → 비밀번호 입력
8. OTP 코드 입력 요청
9. Authenticator에서 코드 확인 후 입력
10. 로그인 완료 ✅
```

### 시나리오 2: 여러 기기에서 로그인 → 세션 관리

```
1. PC에서 로그인 (세션 A)
2. 모바일에서 로그인 (세션 B)
3. 태블릿에서 로그인 (세션 C)
4. /api/auth/sessions 호출 → 3개 세션 확인
5. 세션 B 삭제 → 모바일에서 자동 로그아웃
6. PC와 태블릿은 계속 로그인 상태 유지 ✅
```

---

## 📚 참고 문서

- [고급 인증 상세 문서](../ADVANCED_AUTH.md)
- [패키지 설명 문서](./PACKAGES.md)
- [Swagger API 문서](http://localhost:4000/api-docs)

---

## ❓ 질문

**Q: 여러 기능을 동시에 구현해도 되나요?**  
A: 네, 하지만 하나씩 구현하고 테스트하는 것을 권장합니다. 각 기능은 독립적으로 동작하도록 설계되어 있습니다.

**Q: SSO 브랜치에도 같은 기능을 추가해야 하나요?**  
A: 필요에 따라 선택할 수 있습니다. main에서 구현 후, sso 브랜치로 merge하면 됩니다.

**Q: 어떤 기능부터 시작하는 게 좋을까요?**  
A: **TOTP 2FA**를 추천합니다. 보안 강화 효과가 크고 구현이 상대적으로 쉽습니다.

---

## 🎯 다음 단계

1. **TOTP 2FA 구현** 시작
2. 각 기능별 브랜치 생성 (선택사항)
   ```bash
   git checkout -b feature/2fa
   git checkout -b feature/email-verification
   git checkout -b feature/social-login
   ```
3. 구현 완료 후 main에 merge
4. 필요시 sso 브랜치에도 merge

---

**어떤 기능부터 구현해볼까요?** 🚀

---

## ✅ 로컬 테스트 가능 여부

> 모든 기능을 **로컬 환경에서 테스트 가능**합니다! 각 기능별로 필요한 설정만 다릅니다.

---

## 📋 기능별 로컬 테스트 가능 여부

| 기능 | 로컬 테스트 | 추가 설정 필요 | 비고 |
|------|------------|--------------|------|
| **TOTP 2FA** | ✅ 완전 가능 | ❌ 없음 | Google Authenticator 앱만 필요 |
| **이메일 인증** | ✅ 가능 | ⚠️ SMTP 설정 | 개발용 SMTP 서버 사용 가능 |
| **세션 관리** | ✅ 완전 가능 | ❌ 없음 | 브라우저/기기 시뮬레이션 |
| **소셜 로그인** | ✅ 가능 | ⚠️ OAuth 앱 등록 | localhost 콜백 URL 설정 |
| **기기 관리** | ✅ 완전 가능 | ❌ 없음 | - |
| **매직 링크** | ✅ 가능 | ⚠️ SMTP 설정 | 이메일 발송 필요 |
| **Passkey** | ✅ 가능 | ❌ 없음 | localhost는 HTTPS 불필요 |
| **SMS OTP** | ✅ 가능 | ⚠️ Twilio 계정 | 무료 계정 또는 모킹 |

---

## 🔧 기능별 로컬 테스트 설정 가이드

### 1️⃣ TOTP 2FA - 완전히 로컬 가능 ✅

**추가 설정:** 없음

**테스트 방법:**
1. 서버 실행 (`npm start`)
2. `/api/auth/2fa/setup` 호출 → QR 코드 받기
3. **Google Authenticator** 앱 설치 (iOS/Android)
4. 앱에서 QR 코드 스캔
5. 생성된 6자리 코드로 검증

**장점:**
- 외부 서비스 불필요
- 실제 프로덕션과 동일한 환경
- 모바일 앱만 있으면 됨

---

### 2️⃣ 이메일 인증 - 로컬 가능 (SMTP 설정 필요) ⚠️

**추가 설정:** SMTP 서버

**옵션 1: 개발용 SMTP 서버 (권장)**
```bash
# MailHog 설치 (Docker)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# .env 설정
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

**옵션 2: Gmail (실제 이메일 발송)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 앱 비밀번호 필요
```

**옵션 3: Ethereal Email (테스트용)**
```javascript
// nodemailer의 createTestAccount() 사용
// 실제 이메일 발송 없이 테스트 가능
```

**테스트 방법:**
1. MailHog 실행
2. 이메일 발송 API 호출
3. `http://localhost:8025`에서 이메일 확인
4. 링크 클릭하여 인증 완료

**장점:**
- 실제 이메일 발송 없이 테스트 가능
- 이메일 내용 확인 가능
- 무료

---

### 3️⃣ 활성 세션 관리 - 완전히 로컬 가능 ✅

**추가 설정:** 없음

**테스트 방법:**
1. **같은 PC, 다른 브라우저:**
   - Chrome에서 로그인 (세션 A)
   - Firefox에서 로그인 (세션 B)
   - Safari에서 로그인 (세션 C)

2. **같은 브라우저, 시크릿 모드:**
   - 일반 창: 로그인 (세션 A)
   - 시크릿 창: 로그인 (세션 B)

3. **User-Agent 변경:**
   - Postman/Thunder Client에서 User-Agent 헤더 변경
   - 각기 다른 기기로 인식

**테스트 시나리오:**
```bash
# 세션 1: Chrome
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"

# 세션 2: Firefox
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0"

# 세션 목록 확인
curl -X GET http://localhost:4000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4️⃣ 소셜 로그인 - 로컬 가능 (OAuth 앱 등록 필요) ⚠️

**추가 설정:** OAuth 개발자 콘솔에서 앱 등록

**Google OAuth 설정:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. OAuth 2.0 클라이언트 ID 생성
4. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:4000/api/auth/google/callback
   ```
5. 클라이언트 ID/Secret을 `.env`에 설정

**Kakao OAuth 설정:**
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 등록
3. **Redirect URI** 설정:
   ```
   http://localhost:4000/api/auth/kakao/callback
   ```
4. REST API 키를 `.env`에 설정

**테스트 방법:**
1. `/api/auth/google` 호출
2. 브라우저에서 Google 로그인 페이지로 리다이렉트
3. 로그인 후 `localhost:4000`으로 콜백
4. JWT 토큰 발급

**장점:**
- 실제 OAuth 플로우 테스트 가능
- localhost 콜백 URL 지원
- 무료 (개발용)

---

### 5️⃣ 기기 관리 - 완전히 로컬 가능 ✅

**추가 설정:** 없음

**테스트 방법:**
1. User-Agent 헤더를 변경하여 다른 기기로 인식
2. 각 기기별로 신뢰 등록
3. 기기 목록 조회

**테스트 시나리오:**
```bash
# 기기 1: iPhone
curl -X POST http://localhost:4000/api/auth/devices/trust \
  -H "Authorization: Bearer TOKEN" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"

# 기기 2: MacBook
curl -X POST http://localhost:4000/api/auth/devices/trust \
  -H "Authorization: Bearer TOKEN" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

# 기기 목록 확인
curl -X GET http://localhost:4000/api/auth/devices \
  -H "Authorization: Bearer TOKEN"
```

---

### 6️⃣ 매직 링크 - 로컬 가능 (SMTP 설정 필요) ⚠️

**추가 설정:** 이메일 인증과 동일 (SMTP 서버)

**테스트 방법:**
1. MailHog 또는 개발용 SMTP 서버 설정
2. `/api/auth/magic-link/send` 호출
3. MailHog UI (`http://localhost:8025`)에서 링크 확인
4. 링크 클릭하여 로그인

**장점:**
- 실제 이메일 발송 없이 테스트
- 링크 URL 확인 가능
- 무료

---

### 7️⃣ Passkey (WebAuthn) - 로컬 가능 ✅

**추가 설정:** 없음 (localhost는 HTTPS 불필요)

**중요:** 
- **localhost**는 HTTPS 없이도 WebAuthn 사용 가능
- 실제 도메인에서는 HTTPS 필수

**테스트 방법:**
1. 브라우저에서 Passkey 등록
2. 지문/얼굴 인식 또는 PIN 입력
3. 로그인 시 Passkey 사용

**지원 브라우저:**
- Chrome 67+
- Firefox 60+
- Safari 14+
- Edge 18+

**테스트 시나리오:**
1. `/api/auth/passkey/register/options` 호출
2. 브라우저에서 생체인식 프롬프트 표시
3. 지문/얼굴 인식 또는 PIN 입력
4. 등록 완료
5. 로그인 시 Passkey 사용

**장점:**
- 실제 하드웨어 보안 기능 테스트
- localhost에서 HTTPS 불필요
- 무료

---

### 8️⃣ SMS OTP - 로컬 가능 (Twilio 계정 또는 모킹) ⚠️

**옵션 1: Twilio 무료 계정 (권장)**
1. [Twilio](https://www.twilio.com/) 가입
2. 무료 크레딧 받기 ($15.50)
3. 전화번호 발급 (Trial 번호)
4. Account SID, Auth Token을 `.env`에 설정

**옵션 2: 모킹 (개발용)**
```javascript
// 개발 환경에서 실제 SMS 발송 대신 콘솔에 출력
if (process.env.NODE_ENV === 'development') {
  console.log(`[SMS Mock] OTP: ${otp} → ${phoneNumber}`);
  return { success: true };
}
```

**옵션 3: Twilio Test Credentials**
```javascript
// 실제 SMS 발송 없이 테스트
// Twilio의 테스트 자격 증명 사용
```

**테스트 방법:**
1. Twilio 무료 계정 생성
2. Trial 번호로 SMS 발송 (제한적)
3. 실제 휴대폰으로 OTP 수신
4. 또는 모킹으로 콘솔에 출력

**장점:**
- 실제 SMS 발송 테스트 가능
- 무료 크레딧 제공
- Trial 번호로 제한적 테스트 가능

---

## 🎯 로컬 테스트 환경 구성 요약

### 필수 설정 (모든 기능 공통)
```bash
# MongoDB 실행
docker run -d -p 27017:27017 mongo

# 또는 MongoDB Atlas 사용
```

### 선택적 설정 (기능별)

**이메일 관련 (이메일 인증, 매직 링크):**
```bash
# MailHog 실행
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**소셜 로그인:**
- Google Cloud Console에서 OAuth 앱 등록
- Kakao Developers에서 앱 등록

**SMS OTP:**
- Twilio 무료 계정 생성
- 또는 모킹 사용

---

## 📝 로컬 테스트 체크리스트

### 완전히 로컬 가능 (추가 설정 없음)
- [x] TOTP 2FA
- [x] 활성 세션 관리
- [x] 기기 관리
- [x] Passkey

### 약간의 설정 필요
- [ ] 이메일 인증 (MailHog 또는 SMTP)
- [ ] 매직 링크 (MailHog 또는 SMTP)
- [ ] 소셜 로그인 (OAuth 앱 등록)
- [ ] SMS OTP (Twilio 또는 모킹)

---

## 💡 로컬 테스트 팁

### 1. MailHog로 이메일 테스트
```bash
# MailHog 실행
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# 이메일 확인
# 브라우저에서 http://localhost:8025 접속
```

### 2. 여러 브라우저로 세션 테스트
- Chrome, Firefox, Safari, Edge
- 시크릿 모드 활용
- User-Agent 헤더 변경

### 3. OAuth 로컬 테스트
- localhost 콜백 URL 사용
- 개발자 콘솔에서 앱 등록
- 무료로 충분히 테스트 가능

### 4. Passkey 로컬 테스트
- localhost는 HTTPS 불필요
- 실제 생체인식 사용 가능
- Windows Hello, Touch ID, Face ID 지원

---

## ✅ 결론

**모든 기능을 로컬에서 테스트 가능합니다!**

- **완전히 로컬 가능:** TOTP 2FA, 세션 관리, 기기 관리, Passkey
- **약간의 설정 필요:** 이메일 인증, 매직 링크 (MailHog), 소셜 로그인 (OAuth 앱 등록), SMS OTP (Twilio 또는 모킹)

**추가 비용:** 없음 (모두 무료로 테스트 가능)

**추천 순서:**
1. TOTP 2FA (설정 없음) → 가장 쉬움
2. 이메일 인증 (MailHog 설정) → 5분이면 설정 완료
3. 세션 관리 (설정 없음)
4. 나머지 기능들...

---

**로컬 환경에서 충분히 모든 기능을 테스트할 수 있습니다!** 🎉

