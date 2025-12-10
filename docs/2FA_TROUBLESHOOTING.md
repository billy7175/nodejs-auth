# ✅ 2FA 검증 실패 문제 해결 설명

## 📅 해결일
2025년 12월 10일

---

## 🎉 해결 완료!

**2FA 활성화 성공 = 인증 성공입니다!** ✅

이제 Google Authenticator의 코드와 서버의 코드가 일치하여 검증이 성공합니다.

---

## 🔍 근본 원인

### 문제의 핵심

**`speakeasy.otpauthURL()` 함수가 secret을 인코딩하여 변환합니다.**

### 상세 설명

#### 1. 문제 발생 과정

```
1. Secret 생성: secret.base32 = "JQTGIWBFIRXC4URXORLA"
   ↓
2. otpauthURL() 호출: speakeasy.otpauthURL({ secret: secret.base32, ... })
   ↓
3. URL 생성: otpauth://totp/...?secret=JJIVIR2JK5BEMSKSLBBTIVKSLBHVETCB...
   ↓
4. 문제: URL의 secret이 원본과 다름!
   - 원본: JQTGIWBFIRXC4URXORLA
   - URL: JJIVIR2JK5BEMSKSLBBTIVKSLBHVETCB
   ↓
5. Google Authenticator에 잘못된 secret 등록
   ↓
6. DB에는 원본 secret 저장
   ↓
7. 검증 시 코드 불일치 발생 ❌
```

#### 2. 실제 테스트 결과

```javascript
// 테스트 코드
const secret = 'JQTGIWBFIRXC4URXORLA';
const otpauthUrl = speakeasy.otpauthURL({
  secret: secret,
  label: 'Test',
  issuer: 'Test',
  algorithm: 'sha1',
  digits: 6,
  period: 30
});

// 결과
원본 secret: JQTGIWBFIRXC4URXORLA
URL의 secret: JJIVIR2JK5BEMSKSLBBTIVKSLBHVETCB  // ❌ 다름!
코드 불일치: true
```

---

## ✅ 해결 방법

### 수정 전 (문제 있음)

```javascript
// ❌ 문제 있는 코드
const secret = speakeasy.generateSecret({...});

// otpauthURL()을 직접 호출하면 secret이 변환됨
const otpauthUrl = speakeasy.otpauthURL({
  secret: secret.base32,  // ⚠️ 이 secret이 변환됨!
  label: `${process.env.APP_NAME || 'MyApp'} (${user.email})`,
  issuer: process.env.APP_NAME || 'MyApp',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
});

// DB에 저장
user.totpSecret = secret.base32;  // 원본 secret 저장

// 결과:
// - DB: 원본 secret (JQTGIWBFIRXC4URXORLA)
// - QR 코드: 변환된 secret (JJIVIR2JK5BEMSKSLBBTIVKSLBHVETCB)
// - 불일치 발생!
```

### 수정 후 (해결됨)

#### 방법 1: `secret.otpauth_url` 사용 (새 secret 생성 시)

```javascript
// ✅ 해결된 코드
const secret = speakeasy.generateSecret({...});

// generateSecret()이 반환한 otpauth_url 사용
// 이 URL은 원본 secret을 그대로 유지함
let otpauthUrl = secret.otpauth_url;

// 필요한 파라미터 추가 (secret은 그대로 유지)
if (!otpauthUrl.includes('algorithm=')) {
  const urlObj = new URL(secret.otpauth_url.replace('otpauth://', 'http://'));
  urlObj.searchParams.set('algorithm', 'SHA1');
  urlObj.searchParams.set('digits', '6');
  urlObj.searchParams.set('period', '30');
  otpauthUrl = urlObj.toString().replace('http://', 'otpauth://');
  
  // 검증: URL의 secret이 원본과 일치하는지 확인
  const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
  if (parsedSecret && parsedSecret[1] !== secret.base32) {
    return errorResponse(..., 'QR 코드 생성 중 오류가 발생했습니다.');
  }
}

// DB에 저장
user.totpSecret = secret.base32;  // 원본 secret 저장

// 결과:
// - DB: 원본 secret (JQTGIWBFIRXC4URXORLA)
// - QR 코드: 원본 secret (JQTGIWBFIRXC4URXORLA)
// - 일치! ✅
```

#### 방법 2: URL 직접 구성 (기존 secret 재사용 시)

```javascript
// ✅ 해결된 코드
// 기존 secret을 사용할 때는 URL을 직접 구성
const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

// 검증: URL의 secret이 원본과 일치하는지 확인
const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
if (parsedSecret && parsedSecret[1] !== user.totpSecret) {
  // Secret이 손상되었을 수 있음 - 초기화
  user.totpSecret = null;
  await user.save();
} else {
  console.log('✅ 기존 secret으로 otpauth URL 생성 (원본 secret 유지)');
}

// 결과:
// - DB: 원본 secret (JQTGIWBFIRXC4URXORLA)
// - QR 코드: 원본 secret (JQTGIWBFIRXC4URXORLA)
// - 일치! ✅
```

---

## 📝 수정된 파일

### `backend/src/controllers/twoFAController.js`

#### 수정 1: 새 secret 생성 시 (라인 128-155)

```javascript
// 수정 전
const otpauthUrl = speakeasy.otpauthURL({
  secret: secret.base32,  // ❌ secret 변환됨
  ...
});

// 수정 후
let otpauthUrl = secret.otpauth_url;  // ✅ 원본 secret 유지
// 파라미터 추가 (secret은 그대로)
```

#### 수정 2: 기존 secret 재사용 시 (라인 74-94)

```javascript
// 수정 전
const otpauthUrl = speakeasy.otpauthURL({
  secret: user.totpSecret,  // ❌ secret 변환됨
  ...
});

// 수정 후
const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&...`;  // ✅ 원본 secret 유지
```

#### 수정 3: 이미 활성화된 경우 (라인 22-36)

```javascript
// 수정 전
const otpauthUrl = speakeasy.otpauthURL({
  secret: user.totpSecret,  // ❌ secret 변환됨
  ...
});

// 수정 후
const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&...`;  // ✅ 원본 secret 유지
```

---

## 🔬 검증 로직 추가

### 추가된 검증 포인트

1. **URL 생성 후 검증**
   ```javascript
   const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
   if (parsedSecret && parsedSecret[1] !== secret.base32) {
     // Secret 불일치 감지
     return errorResponse(...);
   }
   ```

2. **Secret 저장 후 검증**
   ```javascript
   const savedUser = await User.findById(userId).select('+totpSecret');
   if (savedUser.totpSecret !== secret.base32) {
     // 저장 실패 감지
     return errorResponse(...);
   }
   ```

3. **Secret 유효성 검증**
   ```javascript
   const secretValidation = speakeasy.totp.verify({
     secret: secret.base32,
     encoding: 'base32',
     token: initialCode,
     window: 0,
   });
   ```

---

## 📊 비교표

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| **Secret 일치** | ❌ 불일치 | ✅ 일치 |
| **QR 코드 secret** | 변환된 secret | 원본 secret |
| **DB secret** | 원본 secret | 원본 secret |
| **검증 결과** | ❌ 실패 | ✅ 성공 |
| **2FA 활성화** | ❌ 실패 | ✅ 성공 |

---

## 🎯 핵심 교훈

### 1. 라이브러리 함수의 동작 이해

**`speakeasy.otpauthURL()`의 동작:**
- Secret을 받아서 URL을 생성할 때 **인코딩/변환**을 수행함
- 이는 의도된 동작일 수 있지만, 우리의 사용 사례에서는 문제가 됨

**해결책:**
- `generateSecret()`이 반환한 `secret.otpauth_url` 사용
- 또는 URL을 직접 구성하여 secret을 그대로 유지

### 2. 검증의 중요성

**모든 단계에서 검증:**
1. Secret 생성 시 검증
2. URL 생성 후 검증 (secret 일치 확인)
3. Secret 저장 후 검증
4. 최종 검증 (코드 생성 가능 여부)

### 3. 디버깅 방법

**문제 발견 과정:**
1. 로그 분석: 코드 불일치 확인
2. 테스트 코드 작성: secret 변환 확인
3. 근본 원인 파악: `otpauthURL()` 함수 동작 확인
4. 해결책 적용: 원본 secret 유지 방법 사용

---

## ✅ 최종 결과

### 성공 지표

- ✅ Secret 생성 및 검증 성공
- ✅ Secret 저장 및 검증 성공
- ✅ QR 코드 생성 (원본 secret 유지)
- ✅ Google Authenticator 등록 성공
- ✅ OTP 코드 검증 성공
- ✅ 2FA 활성화 성공

### 사용자 경험

1. **2FA 설정 시작** → QR 코드 생성
2. **QR 코드 스캔** → Google Authenticator에 등록
3. **6자리 코드 입력** → 검증 성공 ✅
4. **2FA 활성화 완료** → 이제 로그인 시 2FA 필요

---

## 📚 참고 자료

- [2FA_ROOT_CAUSE_ANALYSIS.md](./2FA_ROOT_CAUSE_ANALYSIS.md) - 근본 원인 분석
- [speakeasy 문서](https://github.com/speakeasyjs/speakeasy) - 라이브러리 문서

---

**작성자:** AI Assistant  
**검증 완료:** ✅ 2FA 활성화 성공 확인

