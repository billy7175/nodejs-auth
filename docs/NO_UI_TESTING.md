# 🧪 프론트엔드 UI 없이 테스트하기

> 프론트엔드가 없어도 **모든 인증 기능을 테스트할 수 있습니다!**

---

## ✅ 테스트 도구 목록

### 1. Swagger UI (이미 설정됨) ⭐ 가장 편리
- **URL:** `http://localhost:4000/api-docs`
- **장점:** 브라우저에서 바로 테스트, 문서와 함께 사용
- **단점:** QR 코드 표시 불가 (2FA), 브라우저 기능 제한 (Passkey)

### 2. Postman / Thunder Client
- **장점:** 강력한 API 테스트, 환경 변수 관리
- **단점:** 설치 필요

### 3. cURL (터미널)
- **장점:** 모든 환경에서 사용 가능
- **단점:** 복잡한 요청 작성 어려움

### 4. 브라우저 직접 접속
- **용도:** 소셜 로그인, Passkey, 매직 링크 클릭

### 5. 간단한 HTML 파일 (선택사항) ⚠️ 프론트엔드 코드
- **용도:** QR 코드 표시 (2FA), Passkey 테스트
- **주의:** 이것도 결국 프론트엔드 코드입니다. 하지만 **대부분의 기능은 HTML 없이도 테스트 가능**합니다.

---

## 📋 기능별 테스트 방법

### 1️⃣ TOTP 2FA (2단계 인증)

#### 방법 1: Swagger UI + 모바일 앱

**단계:**
1. Swagger UI에서 `/api/auth/2fa/setup` 호출
2. 응답에서 `qrCodeUrl` 또는 `otpauthUrl` 복사
3. **옵션 A:** 브라우저에서 QR 코드 이미지 URL 직접 열기
   ```
   http://localhost:4000/api/auth/2fa/qr-code?secret=xxx
   ```
4. **옵션 B:** 간단한 HTML 파일 생성 (아래 참고)
5. Google Authenticator 앱으로 QR 스캔
6. 생성된 6자리 코드로 `/api/auth/2fa/verify` 호출

**현재 백엔드 응답 방식:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",  // Base64 이미지
    "otpauthUrl": "otpauth://totp/MyApp:user@example.com?secret=..."
  }
}
```

**QR 코드 사용 방법:**
1. **옵션 A:** `qrCodeUrl`을 브라우저 주소창에 붙여넣기 → 이미지 표시
2. **옵션 B:** 간단한 HTML 파일 직접 생성 (선택사항)

**⚠️ 중요: HTML 파일은 프론트엔드 코드입니다!**

하지만 **HTML 없이도 테스트 가능합니다:**

**방법 1: HTML 없이 테스트 (권장)**
```bash
# 1. Swagger UI에서 /api/auth/2fa/setup 호출
# 2. 응답에서 qrCodeUrl 복사
# 3. 브라우저 주소창에 qrCodeUrl 붙여넣기
#    → 이미지가 바로 표시됨!
# 4. Google Authenticator로 스캔
```

**방법 2: HTML 파일 생성 (선택사항, 프론트엔드 코드)**
```html
<!-- test-2fa.html (프론트엔드 코드) -->
<!DOCTYPE html>
<html>
<head>
    <title>2FA QR Code</title>
</head>
<body>
    <h1>2FA 설정</h1>
    <img id="qrCode" src="" alt="QR Code">
    <script>
        // Swagger에서 받은 qrCodeUrl을 여기에 입력
        const qrCodeUrl = 'data:image/png;base64,iVBORw0KG...';
        document.getElementById('qrCode').src = qrCodeUrl;
    </script>
</body>
</html>
```

**결론:** HTML 파일은 **프론트엔드 코드**이지만, **필수는 아닙니다**. 대부분의 기능은 Swagger UI나 cURL로 테스트 가능합니다.

#### 방법 2: cURL

```bash
# 1. 2FA 설정 요청
curl -X POST http://localhost:4000/api/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# 응답 예시:
# {
#   "success": true,
#   "data": {
#     "secret": "JBSWY3DPEHPK3PXP",
#     "qrCodeUrl": "data:image/png;base64,...",
#     "otpauthUrl": "otpauth://totp/MyApp:user@example.com?secret=..."
#   }
# }

# 2. otpauthUrl을 브라우저에서 열거나 QR 코드 생성
# 3. Google Authenticator로 스캔
# 4. 생성된 6자리 코드로 검증

curl -X POST http://localhost:4000/api/auth/2fa/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'

# 5. 2FA 로그인
curl -X POST http://localhost:4000/api/auth/login/2fa \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "otpCode": "123456"
  }'
```

---

### 2️⃣ 이메일 인증

#### 방법 1: Swagger UI + MailHog

**단계:**
1. MailHog 실행
   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. Swagger UI에서 `/api/auth/email/send-verification` 호출
3. MailHog UI에서 이메일 확인: `http://localhost:8025`
4. 이메일에서 링크 복사
5. 브라우저에서 링크 클릭 또는 cURL로 호출

**cURL 예시:**
```bash
# 이메일 인증 발송
curl -X POST http://localhost:4000/api/auth/email/send-verification \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# MailHog에서 링크 확인 후
# http://localhost:8025 접속 → 이메일 클릭 → 링크 복사

# 링크 검증 (브라우저에서 직접 접속하거나)
curl -X GET "http://localhost:4000/api/auth/email/verify?token=xxx&email=user@example.com"
```

---

### 3️⃣ 활성 세션 관리

#### Swagger UI로 완벽하게 테스트 가능 ✅

**단계:**
1. 여러 브라우저/시크릿 모드에서 로그인
2. Swagger UI에서 `/api/auth/sessions` 호출
3. 세션 목록 확인
4. 특정 세션 삭제: `/api/auth/sessions/:sessionId`

**cURL 예시:**
```bash
# 세션 목록 조회
curl -X GET http://localhost:4000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 특정 세션 삭제
curl -X DELETE http://localhost:4000/api/auth/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**여러 세션 생성하기:**
```bash
# 세션 1: Chrome
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \
  -d '{"email":"test@example.com","password":"password123"}'

# 세션 2: Firefox
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### 4️⃣ 소셜 로그인 (OAuth 2.0)

#### 브라우저 직접 접속 필요 ✅

**단계:**
1. Swagger UI에서 `/api/auth/google` 호출
   - 또는 브라우저에서 직접 접속: `http://localhost:4000/api/auth/google`
2. Google 로그인 페이지로 리다이렉트
3. 로그인 후 `localhost:4000`으로 콜백
4. JWT 토큰 발급

**테스트 방법:**
```bash
# 브라우저에서 직접 접속
# http://localhost:4000/api/auth/google

# 또는 cURL로 리다이렉트 URL 확인
curl -I http://localhost:4000/api/auth/google
# Location 헤더에 Google 로그인 URL이 있음
```

**주의:** 브라우저에서 직접 접속해야 OAuth 플로우가 완료됩니다.

---

### 5️⃣ 기기 관리

#### Swagger UI로 완벽하게 테스트 가능 ✅

**단계:**
1. Swagger UI에서 `/api/auth/devices/trust` 호출
2. User-Agent 헤더 변경하여 다른 기기로 인식
3. `/api/auth/devices`로 기기 목록 확인

**cURL 예시:**
```bash
# 기기 신뢰 등록
curl -X POST http://localhost:4000/api/auth/devices/trust \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"

# 기기 목록 조회
curl -X GET http://localhost:4000/api/auth/devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 6️⃣ 매직 링크 (Passwordless)

#### Swagger UI + MailHog + 브라우저 ✅

**단계:**
1. Swagger UI에서 `/api/auth/magic-link/send` 호출
2. MailHog UI (`http://localhost:8025`)에서 링크 확인
3. 브라우저에서 링크 클릭
4. 자동 로그인 및 JWT 발급

**cURL 예시:**
```bash
# 매직 링크 발송
curl -X POST http://localhost:4000/api/auth/magic-link/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# MailHog에서 링크 확인 후 브라우저에서 클릭
# 또는 cURL로 직접 호출
curl -X GET "http://localhost:4000/api/auth/magic-link/verify?token=xxx&email=user@example.com"
```

---

### 7️⃣ Passkey (WebAuthn)

#### 브라우저 직접 접속 필요 ✅

**단계:**
1. Swagger UI에서 `/api/auth/passkey/register/options` 호출
2. 응답을 복사하여 프론트엔드 코드에서 사용
   - 또는 간단한 HTML 파일 생성 (아래 참고)
3. 브라우저에서 생체인식 프롬프트 표시
4. 지문/얼굴 인식 또는 PIN 입력

**현재 백엔드 응답 방식:**
```json
{
  "success": true,
  "data": {
    "challenge": "...",
    "rp": { "name": "MyApp", "id": "localhost" },
    "user": { "id": "...", "name": "...", "displayName": "..." },
    "pubKeyCredParams": [...],
    "authenticatorSelection": {...},
    "timeout": 60000
  }
}
```

**⚠️ 중요: HTML 파일은 프론트엔드 코드입니다!**

Passkey는 WebAuthn API를 사용하므로 브라우저 환경이 필요합니다. 하지만 **간단한 HTML 파일만 있으면 됩니다:**

```html
<!-- test-passkey.html (프론트엔드 코드) -->
<!DOCTYPE html>
<html>
<head>
    <title>Passkey Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@9.0.0/dist/bundle/index.umd.min.js"></script>
</head>
<body>
    <h1>Passkey 등록</h1>
    <button onclick="registerPasskey()">Passkey 등록</button>
    <div id="result"></div>

    <script>
        async function registerPasskey() {
            // 1. 등록 옵션 가져오기
            const optionsRes = await fetch('http://localhost:4000/api/auth/passkey/register/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'USER_ID' })
            });
            const options = await optionsRes.json();

            // 2. 브라우저에서 Passkey 생성
            const credential = await SimpleWebAuthnBrowser.startRegistration(options.data);

            // 3. 서버로 전송
            const verifyRes = await fetch('http://localhost:4000/api/auth/passkey/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'USER_ID',
                    credential: credential
                })
            });
            const result = await verifyRes.json();
            document.getElementById('result').textContent = JSON.stringify(result, null, 2);
        }
    </script>
</body>
</html>
```

**주의:** 
- 이것도 **프론트엔드 코드**입니다.
- Passkey는 WebAuthn API를 사용하므로 브라우저 환경이 필수입니다.
- 하지만 **간단한 HTML 파일 하나면 충분**합니다. (복잡한 프론트엔드 프레임워크 불필요)

---

### 8️⃣ SMS OTP

#### Swagger UI로 완벽하게 테스트 가능 ✅

**단계:**
1. Swagger UI에서 `/api/auth/sms/send-otp` 호출
2. 실제 휴대폰으로 OTP 수신 (Twilio 사용 시)
3. 받은 코드로 `/api/auth/sms/verify-otp` 호출

**개발 환경 모킹:**
```javascript
// 개발 환경에서 콘솔에 출력
if (process.env.NODE_ENV === 'development') {
  console.log(`[SMS Mock] OTP: ${otp} → ${phoneNumber}`);
  // Swagger 응답에도 OTP 포함
}
```

**cURL 예시:**
```bash
# SMS OTP 발송
curl -X POST http://localhost:4000/api/auth/sms/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+821012345678"}'

# 응답에 OTP 포함 (개발 환경)
# 또는 실제 SMS 수신 (프로덕션)

# OTP 검증
curl -X POST http://localhost:4000/api/auth/sms/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+821012345678",
    "otp": "123456"
  }'
```

---

## 🎯 테스트 방법 요약표

| 기능 | Swagger UI | cURL | 브라우저 | 추가 도구 |
|------|-----------|------|---------|----------|
| **TOTP 2FA** | ✅ 대부분 | ✅ | ⚠️ QR 코드 표시용 | Google Authenticator |
| **이메일 인증** | ✅ | ✅ | ✅ 링크 클릭 | MailHog |
| **세션 관리** | ✅ 완벽 | ✅ | ❌ | - |
| **소셜 로그인** | ⚠️ 시작만 | ⚠️ | ✅ 필수 | OAuth 앱 등록 |
| **기기 관리** | ✅ 완벽 | ✅ | ❌ | - |
| **매직 링크** | ✅ | ✅ | ✅ 링크 클릭 | MailHog |
| **Passkey** | ⚠️ 옵션만 | ❌ | ✅ 필수 | 간단한 HTML |
| **SMS OTP** | ✅ | ✅ | ❌ | Twilio 또는 모킹 |

---

## 🚀 빠른 시작 가이드

### 1. Swagger UI 접속
```
http://localhost:4000/api-docs
```

### 2. 기본 테스트 (UI 불필요)
- ✅ 회원가입/로그인
- ✅ 토큰 갱신
- ✅ 세션 관리
- ✅ 기기 관리
- ✅ SMS OTP (모킹)

### 3. 브라우저 필요한 기능
- ⚠️ 소셜 로그인: 브라우저에서 직접 접속
- ⚠️ Passkey: 간단한 HTML 파일 또는 브라우저
- ⚠️ 매직 링크: MailHog에서 링크 클릭
- ⚠️ 이메일 인증: MailHog에서 링크 클릭

### 4. 모바일 앱 필요한 기능
- ⚠️ TOTP 2FA: Google Authenticator 앱

---

## 💡 실전 테스트 시나리오

### 시나리오 1: TOTP 2FA 전체 플로우

```bash
# 1. 로그인
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 응답에서 accessToken 복사

# 2. 2FA 설정
curl -X POST http://localhost:4000/api/auth/2fa/setup \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# 응답에서 qrCodeUrl 또는 otpauthUrl 복사
# 브라우저에서 QR 코드 이미지 열기 또는 HTML 파일 사용
# Google Authenticator로 스캔

# 3. OTP 코드로 검증
curl -X POST http://localhost:4000/api/auth/2fa/verify \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'

# 4. 2FA 로그인
curl -X POST http://localhost:4000/api/auth/login/2fa \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "otpCode": "654321"
  }'
```

### 시나리오 2: 이메일 인증 + 매직 링크

```bash
# 1. 이메일 인증 발송
curl -X POST http://localhost:4000/api/auth/email/send-verification \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. MailHog 확인: http://localhost:8025
# 3. 이메일에서 링크 복사
# 4. 브라우저에서 링크 클릭 또는 cURL

# 5. 매직 링크 발송
curl -X POST http://localhost:4000/api/auth/magic-link/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 6. MailHog에서 링크 확인 후 클릭
```

---

## 📌 백엔드 Response 방식 정리

### 현재 방식 (JSON Response)

**백엔드는 JSON만 제공합니다:**

1. **TOTP 2FA:**
   ```json
   {
     "success": true,
     "data": {
       "secret": "JBSWY3DPEHPK3PXP",
       "qrCodeUrl": "data:image/png;base64,...",  // Base64 이미지
       "otpauthUrl": "otpauth://totp/..."
     }
   }
   ```
   - `qrCodeUrl`을 브라우저 주소창에 붙여넣으면 이미지 표시
   - HTML 파일은 개발자가 직접 생성 (선택사항)

2. **Passkey:**
   ```json
   {
     "success": true,
     "data": {
       "challenge": "...",
       "rp": {...},
       "user": {...}
     }
   }
   ```
   - HTML 파일은 개발자가 직접 생성 (선택사항)

3. **기타 API:**
   - 모두 JSON response
   - HTML 제공하지 않음

### 백엔드에서 HTML 제공하는 방법 (선택사항)

만약 백엔드에서 HTML을 제공하고 싶다면:

```javascript
// routes/2faRoutes.js
router.get('/2fa/qr-page', authenticate, async (req, res) => {
  const { qrCodeUrl } = await generate2FAQR(req.userId);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>2FA 설정</title></head>
    <body>
      <h1>2FA 설정</h1>
      <img src="${qrCodeUrl}" alt="QR Code">
    </body>
    </html>
  `);
});
```

**하지만 현재는 제공하지 않습니다.** JSON response만 제공하며, 클라이언트(프론트엔드 또는 개발자)가 직접 처리합니다.

---

## ✅ 결론

### 핵심 정리

**1. 백엔드는 JSON API만 제공**
- HTML 파일 제공 안 함
- 모든 응답은 JSON 형식

**2. 프론트엔드 없이도 대부분 테스트 가능**
- ✅ **Swagger UI:** 대부분의 API 테스트 가능 (HTML 불필요)
- ✅ **cURL:** 모든 API 테스트 가능 (HTML 불필요)
- ✅ **브라우저 직접 접속:** 소셜 로그인, 링크 클릭 (HTML 불필요)

**3. HTML 파일이 필요한 경우 (선택사항)**
- ⚠️ **TOTP 2FA:** HTML 없이도 가능 (qrCodeUrl을 브라우저 주소창에 붙여넣기)
- ⚠️ **Passkey:** 간단한 HTML 파일 필요 (WebAuthn API 사용)
  - 하지만 이것도 **프론트엔드 코드**입니다
  - 복잡한 프레임워크 불필요, 단순 HTML + JavaScript면 충분

**4. 결론**
- **대부분의 기능:** 프론트엔드 코드 없이 테스트 가능 ✅
- **일부 기능 (Passkey):** 간단한 HTML 파일 필요 (프론트엔드 코드지만 매우 단순)
- **복잡한 프론트엔드 프레임워크 (React, Vue 등):** 전혀 필요 없음 ❌

**추가 비용:** 없음 (모두 무료)

**추가 설치:** 
- MailHog (Docker) - 이메일 테스트용
- Google Authenticator 앱 - 2FA 테스트용
- Postman/Thunder Client (선택사항)

---

**지금 바로 Swagger UI에서 테스트 시작하세요!** 🚀
```
http://localhost:4000/api-docs
```

