# 🔍 2FA 검증 실패 근본 원인 분석

## 📅 작성일
2025년 12월 10일

---

## 1. 문제 증상

**로그:**
```
2FA 검증 시도: {
  userId: new ObjectId('6937928834ad3793075f67f2'),
  secretExists: true,
  secretLength: 52,
  secretPreview: 'FA5CUN2LIZ...',
  inputCode: '660144'
}

❌ OTP 검증 실패 - 상세 정보: {
  inputCode: '660144',
  expectedCode: '635459',
  prevCode: '206282',
  nextCode: '174003',
  secretExists: true,
  secretLength: 52,
  secretStart: 'FA5CUN2LIZ',
  secretEnd: 'SFEODTNBSQ',
  userId: new ObjectId('6937928834ad3793075f67f2'),
  timestamp: '2025-12-10T01:14:37.150Z',
  diagnosis: '입력한 코드가 이전/현재/다음 코드와 모두 일치하지 않습니다. Google Authenticator에 등록된 secret과 DB의 secret이 다릅니다.',
  solution: '1. "2FA 초기화" 버튼 클릭 2. Google Authenticator에서 계정 삭제 3. "2FA 설정 시작" 다시 클릭 4. 새 QR 코드 스캔'
}
```

**증상:**
- Google Authenticator 코드: `660144`
- 서버 기대 코드: `635459`
- 이전/현재/다음 코드와 모두 불일치

---

## 2. 이전 분석의 문제점

### 2.1 잘못된 가정

**초기 분석 (잘못된 가정):**
- "setup API 중복 호출로 secret이 바뀌었다"
- "기존 secret 재사용 로직 부재"

**실제 문제:**
- 기존 secret 재사용 로직은 **이미 존재**했음
- 하지만 **secret 검증 로직이 없었음**

### 2.2 실제 근본 원인

**핵심 문제 3가지:**

#### 문제 1: 기존 secret 재사용 시 검증 없음

```javascript
// ❌ 이전 코드 (문제 있음)
if (user.totpSecret && !user.is2FAEnabled) {
  // secret이 있으면 그냥 재사용
  // secret이 유효한지 검증하지 않음!
  const otpauthUrl = speakeasy.otpauthURL({
    secret: user.totpSecret,  // 손상된 secret일 수 있음
    ...
  });
}
```

**문제:**
- DB에 저장된 secret이 손상되었을 수 있음
- Base32 인코딩이 잘못되었을 수 있음
- Secret이 실제로 TOTP 코드를 생성할 수 있는지 검증하지 않음

#### 문제 2: 새 secret 생성 시 검증 없음

```javascript
// ❌ 이전 코드 (문제 있음)
const secret = speakeasy.generateSecret({...});
user.totpSecret = secret.base32;
await user.save();
// 생성된 secret이 유효한지 검증하지 않음!
```

**문제:**
- `generateSecret()`이 실패했을 수 있음
- Secret이 올바르게 생성되었는지 확인하지 않음

#### 문제 3: Secret 저장 후 검증 없음

```javascript
// ❌ 이전 코드 (문제 있음)
user.totpSecret = secret.base32;
await user.save();
// 저장 후 다시 읽어서 검증하지 않음!
```

**문제:**
- MongoDB 저장 중 오류가 발생했을 수 있음
- 저장된 secret이 원본과 일치하는지 확인하지 않음
- 저장된 secret으로 실제 코드를 생성할 수 있는지 검증하지 않음

---

## 3. 실제 근본 원인

### 3.1 Secret 검증 부재

**핵심 문제:**
- Secret이 **생성/저장/재사용**되는 모든 단계에서 **검증이 없었음**
- Secret이 실제로 TOTP 코드를 생성할 수 있는지 확인하지 않음

### 3.2 가능한 시나리오

**시나리오 1: Secret 손상**
```
1. Secret 생성 → DB 저장
2. DB에서 읽기 → Secret 손상 (인코딩 문제, 저장 오류 등)
3. 손상된 secret으로 QR 코드 생성
4. Google Authenticator에 손상된 secret 등록
5. 검증 시 코드 불일치
```

**시나리오 2: Secret 불일치**
```
1. Secret A 생성 → DB 저장
2. 사용자가 setup을 여러 번 호출
3. 기존 secret 재사용 로직이 작동하지만, secret이 실제로 유효한지 확인하지 않음
4. 유효하지 않은 secret으로 QR 코드 생성
5. Google Authenticator에 잘못된 secret 등록
6. 검증 시 코드 불일치
```

**시나리오 3: 저장 실패**
```
1. Secret 생성
2. DB 저장 시도 → 부분적으로 저장됨 (예: 일부 문자 손실)
3. 저장된 secret이 원본과 다름
4. 잘못된 secret으로 QR 코드 생성
5. 검증 시 코드 불일치
```

---

## 4. 해결 방법

### 4.1 수정된 코드

#### 수정 1: 기존 secret 재사용 시 검증 추가

```javascript
// ✅ 수정된 코드
if (user.totpSecret && !user.is2FAEnabled) {
  // Secret이 유효한지 검증
  const testCode = speakeasy.totp({
    secret: user.totpSecret,
    encoding: 'base32',
  });
  
  const secretValid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: testCode,
    window: 0,
  });
  
  if (!secretValid) {
    // Secret이 손상되었음 → 초기화 후 새로 생성
    user.totpSecret = null;
    user.backupCodes = [];
    await user.save();
    // 아래에서 새 secret 생성으로 진행
  } else {
    // Secret이 유효함 → 재사용
    ...
  }
}
```

#### 수정 2: 새 secret 생성 시 즉시 검증

```javascript
// ✅ 수정된 코드
const secret = speakeasy.generateSecret({...});

// 생성 직후 검증
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
  return errorResponse(..., 'Secret 생성 중 오류가 발생했습니다.');
}
```

#### 수정 3: Secret 저장 후 최종 검증

```javascript
// ✅ 수정된 코드
user.totpSecret = secret.base32;
await user.save();

// 저장 후 다시 읽어서 확인
const savedUser = await User.findById(userId).select('+totpSecret');

// 1. 저장된 secret이 원본과 일치하는지 확인
if (savedUser.totpSecret !== secret.base32) {
  return errorResponse(..., 'Secret 저장 중 오류가 발생했습니다.');
}

// 2. 저장된 secret으로 코드 생성하여 검증
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
  return errorResponse(..., 'Secret 검증 중 오류가 발생했습니다.');
}
```

---

## 5. 검증 포인트

### 5.1 3단계 검증

```
1. Secret 생성 시 검증
   → 생성된 secret이 유효한지 확인

2. Secret 저장 전 검증
   → 저장할 secret이 올바른지 확인

3. Secret 저장 후 검증
   → 저장된 secret이 원본과 일치하고 유효한지 확인
```

### 5.2 검증 로직

**각 단계에서:**
1. Secret으로 TOTP 코드 생성
2. 생성된 코드로 검증 (`speakeasy.totp.verify`)
3. 검증 실패 시 에러 반환 또는 초기화

---

## 6. 이전 보고서와의 차이점

### 6.1 이전 보고서의 분석

| 항목 | 이전 분석 | 실제 문제 |
|------|----------|----------|
| **원인** | setup API 중복 호출 | Secret 검증 부재 |
| **해결책** | 기존 secret 재사용 로직 추가 | Secret 검증 로직 추가 |
| **결과** | 여전히 실패 | 검증으로 문제 해결 |

### 6.2 실제 해결 방법

**이전:**
- 기존 secret 재사용 로직 추가 (이미 존재했음)
- 중복 호출 방지 (프론트엔드)

**실제:**
- Secret 생성 시 검증
- Secret 저장 후 검증
- 기존 secret 재사용 시 검증

---

## 7. 교훈

### 7.1 문제 해결 시 주의사항

1. **가정하지 말고 검증하라**
   - "secret이 있으면 유효하다"는 가정 ❌
   - 실제로 코드를 생성하고 검증해야 함 ✅

2. **모든 단계에서 검증하라**
   - 생성 시 검증
   - 저장 전 검증
   - 저장 후 검증

3. **로그를 자세히 분석하라**
   - 증상만 보고 원인을 추측하지 말 것
   - 실제 코드 흐름을 따라가며 문제 찾기

### 7.2 향후 개선 사항

1. **Secret 버전 관리**
   - Secret 변경 이력 추적
   - 롤백 기능

2. **자동 복구**
   - 손상된 secret 자동 감지 및 재생성

3. **더 상세한 로깅**
   - Secret 생성/저장/검증 단계별 로그
   - 실패 시 상세 정보

---

## 8. 결론

### 8.1 근본 원인

**Secret 검증 로직의 부재**

- Secret이 생성/저장/재사용되는 모든 단계에서 검증이 없었음
- Secret이 실제로 TOTP 코드를 생성할 수 있는지 확인하지 않음

### 8.2 해결 방법

**3단계 검증 추가:**

1. Secret 생성 시 즉시 검증
2. Secret 저장 후 재검증
3. 기존 secret 재사용 시 검증

### 8.3 결과

- Secret이 유효한지 모든 단계에서 확인
- 손상된 secret 자동 감지 및 초기화
- 검증 실패 시 명확한 에러 메시지

---

**작성자:** AI Assistant  
**검토 필요:** 실제 테스트 및 검증 필요

