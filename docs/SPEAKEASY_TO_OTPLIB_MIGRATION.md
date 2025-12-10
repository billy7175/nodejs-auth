# 🔄 speakeasy → otplib 마이그레이션 영향도 분석

## 📊 영향도 요약

| 항목 | 영향도 | 설명 |
|------|--------|------|
| **기존 DB 데이터** | ✅ **영향 없음** | base32 secret 형식 동일 |
| **Google Authenticator 호환성** | ✅ **영향 없음** | TOTP 표준 준수 |
| **코드 변경 범위** | ⚠️ **중간** | API 함수명 및 파라미터 구조 변경 |
| **기능 동작** | ✅ **동일** | TOTP 생성/검증 로직 동일 |
| **기존 사용자 영향** | ✅ **영향 없음** | 재등록 불필요 |

---

## 🔍 현재 코드에서 speakeasy 사용 부분

### 1. Secret 생성
```javascript
// 현재 (speakeasy)
const secret = speakeasy.generateSecret({
  name: 'MyApp (user@example.com)',
  issuer: 'MyApp',
});
// secret.base32 → DB 저장
```

### 2. TOTP 코드 생성
```javascript
// 현재 (speakeasy)
const code = speakeasy.totp({
  secret: user.totpSecret,
  encoding: 'base32',
});
```

### 3. TOTP 코드 검증
```javascript
// 현재 (speakeasy)
const isValid = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: code,
  window: 2,
});
```

### 4. otpauth URL 생성
```javascript
// 현재 (speakeasy) - 하지만 직접 URL 구성 중
const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}...`;
// 또는 secret.otpauth_url 사용
```

---

## 🔄 otplib로 변경 시

### 1. Secret 생성
```javascript
// 변경 후 (otplib)
import { authenticator } from 'otplib';

const secret = authenticator.generateSecret();
// secret → DB 저장 (base32 형식 동일)
```

**변경점:**
- ✅ `generateSecret()` 파라미터 없음 (name, issuer는 URL 생성 시 사용)
- ✅ 반환값이 문자열 (base32 형식)

### 2. TOTP 코드 생성
```javascript
// 변경 후 (otplib)
const code = authenticator.generate(secret);
```

**변경점:**
- ✅ 파라미터 구조 단순화 (secret만 전달)
- ✅ `encoding: 'base32'` 불필요 (자동 인식)

### 3. TOTP 코드 검증
```javascript
// 변경 후 (otplib)
const isValid = authenticator.verify({
  token: code,
  secret: user.totpSecret,
  window: [2, 2], // [이전, 이후] 시간 윈도우
});
```

**변경점:**
- ✅ 파라미터 순서 변경 (`token`이 먼저)
- ✅ `window` 형식 변경 (배열로 전후 시간 지정)
- ✅ `encoding` 불필요

### 4. otpauth URL 생성
```javascript
// 변경 후 (otplib)
const otpauthUrl = authenticator.keyuri(
  user.email,
  'MyApp',
  secret
);
```

**변경점:**
- ✅ 함수명 변경 (`otpauthURL` → `keyuri`)
- ✅ 파라미터 구조 변경 (email, issuer, secret 순서)

---

## 📝 코드 변경 범위

### 변경이 필요한 파일
1. `backend/src/controllers/twoFAController.js` (주요 변경)
   - `speakeasy` import → `otplib` import
   - 모든 `speakeasy.*` 호출 변경
   - 약 **15곳** 수정 필요

### 변경이 필요 없는 부분
1. ✅ **DB 스키마** - `totpSecret` 필드 형식 동일 (base32)
2. ✅ **기존 사용자 데이터** - 재등록 불필요
3. ✅ **Google Authenticator** - 호환성 유지
4. ✅ **QR 코드 생성** - `qrcode` 패키지는 그대로 사용

---

## ⚠️ 주의사항

### 1. 기존 Secret 호환성
- ✅ **호환됨**: base32 형식이 동일하므로 기존 secret 그대로 사용 가능
- ✅ **재등록 불필요**: 사용자가 Google Authenticator에서 재등록할 필요 없음

### 2. API 파라미터 차이
- ⚠️ `window` 파라미터 형식 변경: `2` → `[2, 2]`
- ⚠️ `verify` 파라미터 순서: `token`이 먼저 와야 함

### 3. otpauth URL 생성
- ⚠️ 현재 코드는 직접 URL 구성 중이므로 큰 변경 없음
- ⚠️ `authenticator.keyuri()` 사용 시 파라미터 순서 주의

---

## 🎯 마이그레이션 단계

### Step 1: 패키지 교체
```bash
npm uninstall speakeasy
npm install otplib
```

### Step 2: Import 변경
```javascript
// Before
const speakeasy = require('speakeasy');

// After
const { authenticator } = require('otplib');
```

### Step 3: 함수 호출 변경
- `speakeasy.generateSecret()` → `authenticator.generateSecret()`
- `speakeasy.totp()` → `authenticator.generate()`
- `speakeasy.totp.verify()` → `authenticator.verify()`

### Step 4: 테스트
- ✅ 기존 사용자의 2FA 코드 검증 테스트
- ✅ 새 사용자의 2FA 설정 테스트
- ✅ Google Authenticator 호환성 테스트

---

## 📊 예상 변경 코드량

| 파일 | 변경 라인 수 | 난이도 |
|------|-------------|--------|
| `twoFAController.js` | ~15곳 (Find & Replace 가능) | ⭐ (쉬움) |
| `package.json` | 1줄 | ⭐ (쉬움) |

**총 예상 시간:** 3~5분

**이유:**
- Find & Replace로 대부분 처리 가능
- 함수명과 파라미터만 변경
- 로직 변경 없음

---

## ✅ 결론

### 영향도: **낮음 ~ 중간**

**이유:**
1. ✅ **기존 데이터 호환**: base32 secret 형식 동일
2. ✅ **기능 동일**: TOTP 표준 준수
3. ⚠️ **코드 변경 필요**: API 함수명 및 파라미터 구조 변경
4. ✅ **사용자 영향 없음**: 재등록 불필요

**권장사항:**
- 테스트 환경에서 먼저 마이그레이션 테스트
- 기존 사용자의 2FA 코드 검증 확인
- 마이그레이션 후 모든 기능 테스트

---

**작성일**: 2025년 12월 10일

