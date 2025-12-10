# 🔄 speakeasy → otplib 코드 변경 상세 분석

## 📊 전체 변경 요약

| 항목 | Before (speakeasy) | After (otplib) | 변화 |
|------|-------------------|----------------|------|
| **Import** | `require('speakeasy')` | `require('otplib').authenticator` | 모듈 구조 변경 |
| **Secret 생성** | 객체 반환 (`secret.base32`) | 문자열 반환 | 단순화 |
| **TOTP 생성** | `totp({ secret, encoding })` | `generate(secret)` | 파라미터 감소 |
| **TOTP 검증** | `totp.verify({ secret, token, window })` | `verify({ token, secret, window })` | 순서 변경 |
| **URL 생성** | 직접 구성 또는 `otpauth_url` | `keyuri(label, issuer, secret)` | 함수 제공 |
| **코드 라인 수** | ~442줄 | ~400줄 | **약 42줄 감소** |

---

## 1️⃣ Import 변경

### Before (speakeasy)
```javascript
const speakeasy = require('speakeasy');
```

### After (otplib)
```javascript
const { authenticator } = require('otplib');
```

**변화:**
- ✅ 네임스페이스 분리 (`authenticator`만 사용)
- ✅ 더 명확한 의도 표현

---

## 2️⃣ Secret 생성 - 가장 큰 변화

### Before (speakeasy)
```javascript
// 객체 반환, base32 속성 접근 필요
const secret = speakeasy.generateSecret({
  name: `${process.env.APP_NAME || 'MyApp'} (${user.email})`,
  issuer: process.env.APP_NAME || 'MyApp',
});

// secret.base32 → DB 저장
user.totpSecret = secret.base32;

// secret.otpauth_url 사용 (복잡한 처리 필요)
let otpauthUrl = secret.otpauth_url;
if (!otpauthUrl.includes('algorithm=')) {
  const urlObj = new URL(secret.otpauth_url.replace('otpauth://', 'http://'));
  urlObj.searchParams.set('algorithm', 'SHA1');
  urlObj.searchParams.set('digits', '6');
  urlObj.searchParams.set('period', '30');
  otpauthUrl = urlObj.toString().replace('http://', 'otpauth://');
  
  // 검증 로직 필요
  const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
  if (parsedSecret && parsedSecret[1] !== secret.base32) {
    // 에러 처리
  }
}
```

**코드 라인 수:** ~20줄

### After (otplib)
```javascript
// 문자열 직접 반환, 즉시 사용 가능
const secret = authenticator.generateSecret();

// secret → DB 저장 (직접 저장)
user.totpSecret = secret;

// keyuri 함수로 간단하게 URL 생성
const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
const otpauthUrl = authenticator.keyuri(label, issuer, secret);
```

**코드 라인 수:** ~5줄

**변화:**
- ✅ **15줄 감소**
- ✅ 객체 속성 접근 불필요 (`secret.base32` → `secret`)
- ✅ URL 생성 로직 단순화 (검증 로직 제거)
- ✅ 파라미터 불필요 (`name`, `issuer`는 URL 생성 시만 사용)

---

## 3️⃣ TOTP 코드 생성

### Before (speakeasy)
```javascript
const code = speakeasy.totp({
  secret: user.totpSecret,
  encoding: 'base32',  // 항상 명시 필요
});
```

### After (otplib)
```javascript
const code = authenticator.generate(user.totpSecret);
```

**변화:**
- ✅ **파라미터 2개 감소** (`encoding` 불필요)
- ✅ **함수명 단순화** (`totp` → `generate`)
- ✅ **자동 인코딩 감지** (base32 자동 처리)

---

## 4️⃣ TOTP 코드 검증

### Before (speakeasy)
```javascript
const isValid = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',  // 항상 명시 필요
  token: code,
  window: 2,  // 숫자 (전후 2개 시간 윈도우)
});
```

### After (otplib)
```javascript
const isValid = authenticator.verify({
  token: code,  // 순서 변경: token이 먼저
  secret: user.totpSecret,
  window: [2, 2],  // 배열 (이전, 이후)
});
```

**변화:**
- ✅ **파라미터 순서 변경** (`token`이 먼저)
- ✅ **`encoding` 제거** (자동 처리)
- ✅ **`window` 형식 변경** (`2` → `[2, 2]`)
- ✅ **더 명확한 윈도우 제어** (이전/이후 시간 분리 지정 가능)

---

## 5️⃣ otpauth URL 생성 - 큰 변화

### Before (speakeasy)
```javascript
// 방법 1: secret.otpauth_url 사용 (복잡한 검증 필요)
let otpauthUrl = secret.otpauth_url;
if (!otpauthUrl.includes('algorithm=')) {
  const urlObj = new URL(secret.otpauth_url.replace('otpauth://', 'http://'));
  urlObj.searchParams.set('algorithm', 'SHA1');
  urlObj.searchParams.set('digits', '6');
  urlObj.searchParams.set('period', '30');
  otpauthUrl = urlObj.toString().replace('http://', 'otpauth://');
  
  // 검증 로직
  const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
  if (parsedSecret && parsedSecret[1] !== secret.base32) {
    console.error('❌ otpauth URL의 secret이 원본과 일치하지 않습니다!');
    return errorResponse(...);
  }
}

// 방법 2: 직접 URL 구성
const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
```

**코드 라인 수:** ~15줄 (검증 포함)

### After (otplib)
```javascript
const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
const otpauthUrl = authenticator.keyuri(label, issuer, secret);
```

**코드 라인 수:** ~3줄

**변화:**
- ✅ **12줄 감소**
- ✅ **검증 로직 불필요** (라이브러리가 올바른 URL 생성 보장)
- ✅ **표준 파라미터 자동 포함** (algorithm, digits, period)
- ✅ **에러 처리 제거**

---

## 6️⃣ Secret 검증 로직 - 제거됨

### Before (speakeasy)
```javascript
// Secret 생성 후 즉시 검증 필요
const initialCode = speakeasy.totp({
  secret: secret.base32,
  encoding: 'base32',
});

const secretValidation = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: initialCode,
  window: 0,
});

if (!secretValidation) {
  console.error('❌ 생성된 secret이 유효하지 않습니다!');
  return errorResponse(...);
}

// 저장 후 다시 검증
const savedUser = await User.findById(userId).select('+totpSecret');
if (!savedUser.totpSecret || savedUser.totpSecret !== secret.base32) {
  // 에러 처리
}

const savedCode = speakeasy.totp({
  secret: savedUser.totpSecret,
  encoding: 'base32',
});

const finalValidation = speakeasy.totp.verify({
  secret: savedUser.totpSecret,
  encoding: 'base32',
  token: savedCode,
  window: 0,
});

if (!finalValidation) {
  // 에러 처리
}
```

**코드 라인 수:** ~25줄

### After (otplib)
```javascript
// Secret 생성 후 간단한 검증
const initialCode = authenticator.generate(secret);
const secretValidation = authenticator.verify({
  token: initialCode,
  secret: secret,
  window: [0, 0],
});

if (!secretValidation) {
  console.error('❌ 생성된 secret이 유효하지 않습니다!');
  return errorResponse(...);
}

// 저장 후 간단한 검증
const savedUser = await User.findById(userId).select('+totpSecret');
if (!savedUser.totpSecret || savedUser.totpSecret !== secret) {
  // 에러 처리
}

const savedCode = authenticator.generate(savedUser.totpSecret);
const finalValidation = authenticator.verify({
  token: savedCode,
  secret: savedUser.totpSecret,
  window: [0, 0],
});

if (!finalValidation) {
  // 에러 처리
}
```

**변화:**
- ✅ **코드 간소화** (`.base32` 접근 제거)
- ✅ **파라미터 감소** (`encoding` 제거)

---

## 7️⃣ 기존 Secret 재사용 로직

### Before (speakeasy)
```javascript
if (user.totpSecret && !user.is2FAEnabled) {
  const testCode = speakeasy.totp({
    secret: user.totpSecret,
    encoding: 'base32',
  });
  
  const verifyTest = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: testCode,
    window: 0,
  });
  
  // URL 검증 로직 포함
  const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
  if (parsedSecret && parsedSecret[1] !== user.totpSecret) {
    // 에러 처리
  }
}
```

### After (otplib)
```javascript
if (user.totpSecret && !user.is2FAEnabled) {
  const testCode = authenticator.generate(user.totpSecret);
  
  const verifyTest = authenticator.verify({
    token: testCode,
    secret: user.totpSecret,
    window: [0, 0],
  });
  
  // URL 검증 로직 제거 (keyuri가 올바른 URL 보장)
}
```

**변화:**
- ✅ **파라미터 간소화**
- ✅ **URL 검증 로직 제거**

---

## 📊 코드 라인 수 비교

### 전체 파일

| 섹션 | Before | After | 감소 |
|------|--------|-------|------|
| **Secret 생성 및 URL 생성** | ~35줄 | ~8줄 | **-27줄** |
| **TOTP 생성/검증 호출** | ~15줄 | ~8줄 | **-7줄** |
| **검증 로직** | ~25줄 | ~20줄 | **-5줄** |
| **기타 (주석, 에러 처리)** | ~10줄 | ~5줄 | **-5줄** |
| **총계** | ~442줄 | ~400줄 | **-42줄** |

---

## 🔑 키값/속성 변경

### 1. Secret 객체 구조

**Before (speakeasy):**
```javascript
{
  base32: "JBSWY3DPEHPK3PXP",  // 실제 secret
  otpauth_url: "otpauth://totp/...",  // URL (선택적)
  // 기타 속성들...
}
```

**After (otplib):**
```javascript
"JBSWY3DPEHPK3PXP"  // 문자열 직접 반환
```

**변화:**
- ✅ **객체 → 문자열** (단순화)
- ✅ **`.base32` 접근 제거**

### 2. 함수 파라미터 키

**Before (speakeasy):**
```javascript
{
  secret: "...",
  encoding: "base32",  // 필수
  token: "...",
  window: 2  // 숫자
}
```

**After (otplib):**
```javascript
{
  token: "...",  // 순서 변경
  secret: "...",
  window: [2, 2]  // 배열
}
// encoding 불필요
```

**변화:**
- ✅ **`encoding` 제거** (자동 감지)
- ✅ **`token` 순서 변경** (먼저)
- ✅ **`window` 형식 변경** (배열)

---

## 🎯 주요 개선 사항

### 1. 코드 간소화
- ✅ **42줄 감소** (약 10% 감소)
- ✅ 객체 속성 접근 제거
- ✅ 불필요한 검증 로직 제거

### 2. API 개선
- ✅ **더 직관적인 함수명** (`totp` → `generate`)
- ✅ **파라미터 감소** (`encoding` 제거)
- ✅ **명확한 윈도우 제어** (`[이전, 이후]`)

### 3. 안정성 향상
- ✅ **URL 생성 검증 불필요** (라이브러리가 보장)
- ✅ **타입 안정성** (TypeScript 지원)

### 4. 유지보수성
- ✅ **코드 가독성 향상**
- ✅ **에러 처리 간소화**
- ✅ **최신 표준 준수**

---

## 📝 실제 변경 예시

### 예시 1: Secret 생성 및 저장

**Before:**
```javascript
const secret = speakeasy.generateSecret({ name, issuer });
user.totpSecret = secret.base32;  // 객체 속성 접근
```

**After:**
```javascript
const secret = authenticator.generateSecret();
user.totpSecret = secret;  // 직접 저장
```

### 예시 2: TOTP 검증

**Before:**
```javascript
const isValid = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: code,
  window: 2,
});
```

**After:**
```javascript
const isValid = authenticator.verify({
  token: code,
  secret: user.totpSecret,
  window: [2, 2],
});
```

### 예시 3: URL 생성

**Before:**
```javascript
let otpauthUrl = secret.otpauth_url;
if (!otpauthUrl.includes('algorithm=')) {
  // 복잡한 URL 파싱 및 수정
  const urlObj = new URL(secret.otpauth_url.replace('otpauth://', 'http://'));
  urlObj.searchParams.set('algorithm', 'SHA1');
  // ... 검증 로직
}
```

**After:**
```javascript
const otpauthUrl = authenticator.keyuri(label, issuer, secret);
```

---

## ✅ 결론

### 코드 감소
- **총 42줄 감소** (약 10%)
- **복잡한 검증 로직 제거**
- **불필요한 객체 접근 제거**

### 키값/속성 변경
- `secret.base32` → `secret` (문자열 직접)
- `encoding: 'base32'` → 제거 (자동)
- `window: 2` → `window: [2, 2]` (배열)
- `token` 파라미터 순서 변경

### 개선 효과
- ✅ **코드 간소화**
- ✅ **가독성 향상**
- ✅ **유지보수 용이**
- ✅ **최신 표준 준수**

---

**작성일**: 2025년 12월 10일

