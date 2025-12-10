# 🔀 브랜치 분리 가이드 (2FA → main)

## 📋 현재 상황

- **현재 브랜치**: `sso`
- **2FA 변경사항**: 아직 커밋되지 않은 상태 (untracked files)
- **목표**: main 브랜치에서 2FA 브랜치를 새로 만들어서 2FA 기능만 독립적으로 테스트

---

## ✅ 가능 여부

**네, 문제없이 작동합니다!**

### 이유

1. **2FA와 SSO는 독립적**
   - `twoFAController.js`: SSO 관련 코드 없음
   - `twoFARoutes.js`: SSO 의존성 없음
   - `authController.js`: 2FA 관련 코드 없음

2. **User 모델 호환성**
   - SSO 필드 (`ssoId`, `ssoProvider`)와 2FA 필드 (`totpSecret`, `is2FAEnabled`, `backupCodes`)는 독립적
   - main 브랜치의 User 모델에 2FA 필드만 추가하면 됨

---

## 🚀 실행 방법

### 방법 1: 현재 변경사항 커밋 후 분리 (권장)

```bash
# 1. 현재 sso 브랜치에서 2FA 변경사항 커밋
git add backend/src/controllers/twoFAController.js
git add backend/src/routes/twoFARoutes.js
git add backend/public/
git add docs/2FA_*.md docs/QR_CODE_*.md docs/NAMING_CONVENTION.md
git add backend/src/models/User.js  # 2FA 필드만 포함
git add backend/src/app.js  # twoFARoutes 추가 부분만
git add backend/package.json  # speakeasy, qrcode 추가
git commit -m "feat: 2FA 기능 추가"

# 2. main 브랜치로 이동
git checkout main

# 3. 2FA 브랜치 생성
git checkout -b 2fa

# 4. sso 브랜치에서 2FA 관련 파일만 가져오기
git checkout sso -- backend/src/controllers/twoFAController.js
git checkout sso -- backend/src/routes/twoFARoutes.js
git checkout sso -- backend/public/
git checkout sso -- docs/2FA_*.md docs/QR_CODE_*.md docs/NAMING_CONVENTION.md

# 5. User.js에서 2FA 필드만 추가 (수동 편집 필요)
# - totpSecret
# - is2FAEnabled
# - backupCodes

# 6. app.js에서 twoFARoutes 추가 (수동 편집 필요)
# app.use('/api/auth/2fa', twoFARoutes);

# 7. package.json에 패키지 추가 (수동 편집 필요)
# "speakeasy": "^2.0.0",
# "qrcode": "^1.5.3"

# 8. 커밋
git add .
git commit -m "feat: 2FA 기능 추가 (SSO와 분리)"
```

### 방법 2: Stash 사용 (더 안전)

```bash
# 1. 현재 변경사항 stash
git stash push -u -m "2FA 기능 변경사항"

# 2. main 브랜치로 이동
git checkout main

# 3. 2FA 브랜치 생성
git checkout -b 2fa

# 4. 2fa 브랜치에서 stash 가져오기
git stash list  # stash 번호 확인
git stash apply stash@{0}  # 또는 stash 번호

# 5. SSO 관련 파일 제거 (필요시)
# - backend/src/config/keycloak.js (제거하지 않아도 됨, 사용 안 함)
# - backend/src/routes/ssoRoutes.js (제거하지 않아도 됨, 사용 안 함)
# - backend/src/utils/keycloakAdmin.js (제거하지 않아도 됨, 사용 안 함)

# 6. User.js에서 SSO 필드 제거 (선택사항)
# - ssoId
# - ssoProvider

# 7. app.js에서 SSO 관련 코드 제거 (선택사항)
# - SSO 설정 부분
# - ssoRoutes

# 8. 커밋
git add .
git commit -m "feat: 2FA 기능 추가 (SSO와 분리)"
```

---

## ⚠️ 주의사항

### 1. User.js 모델

**main 브랜치의 User.js:**
```javascript
// SSO 필드 없음
// 2FA 필드 없음
```

**sso 브랜치의 User.js:**
```javascript
// SSO 필드 있음
ssoId: ...
ssoProvider: ...

// 2FA 필드 있음
totpSecret: ...
is2FAEnabled: ...
backupCodes: ...
```

**2FA 브랜치의 User.js (목표):**
```javascript
// SSO 필드 없음 (또는 있어도 사용 안 함)
// 2FA 필드 있음
totpSecret: ...
is2FAEnabled: ...
backupCodes: ...
```

### 2. app.js

**sso 브랜치의 app.js:**
```javascript
// SSO 설정
if (isSsoEnabled()) { ... }

// 라우트
app.use('/api/sso', ssoRoutes);
app.use('/api/auth/2fa', twoFARoutes);
```

**2FA 브랜치의 app.js (목표):**
```javascript
// SSO 설정 없음 (또는 있어도 사용 안 함)

// 라우트
app.use('/api/auth/2fa', twoFARoutes);
```

### 3. package.json

**sso 브랜치의 package.json:**
```json
{
  "dependencies": {
    "keycloak-connect": "...",  // SSO용
    "express-session": "...",   // SSO용
    "speakeasy": "...",          // 2FA용
    "qrcode": "..."              // 2FA용
  }
}
```

**2FA 브랜치의 package.json (목표):**
```json
{
  "dependencies": {
    "speakeasy": "...",          // 2FA용
    "qrcode": "..."              // 2FA용
  }
}
```

---

## 🔍 확인 사항

### 2FA 독립성 확인

```bash
# 2FA 컨트롤러에 SSO 의존성 확인
grep -r "keycloak\|sso\|SSO" backend/src/controllers/twoFAController.js
# 결과: 없어야 함 ✅

# 2FA 라우트에 SSO 의존성 확인
grep -r "keycloak\|sso\|SSO" backend/src/routes/twoFARoutes.js
# 결과: 없어야 함 ✅
```

### SSO 독립성 확인

```bash
# SSO 컨트롤러에 2FA 의존성 확인
grep -r "2fa\|2FA\|totp\|TOTP" backend/src/controllers/authController.js
# 결과: 없어야 함 ✅
```

---

## 📝 최종 체크리스트

### 2FA 브랜치에 포함해야 할 파일

- ✅ `backend/src/controllers/twoFAController.js`
- ✅ `backend/src/routes/twoFARoutes.js`
- ✅ `backend/public/2fa-setup.html`
- ✅ `backend/public/index.html` (2FA 관련 부분)
- ✅ `backend/src/models/User.js` (2FA 필드만)
- ✅ `backend/src/app.js` (twoFARoutes 추가 부분만)
- ✅ `backend/package.json` (speakeasy, qrcode만)
- ✅ `docs/2FA_*.md`
- ✅ `docs/QR_CODE_REFERENCE.md`
- ✅ `docs/NAMING_CONVENTION.md`

### 2FA 브랜치에서 제거할 파일 (선택사항)

- ⚠️ `backend/src/config/keycloak.js` (사용 안 함, 제거 가능)
- ⚠️ `backend/src/routes/ssoRoutes.js` (사용 안 함, 제거 가능)
- ⚠️ `backend/src/utils/keycloakAdmin.js` (사용 안 함, 제거 가능)
- ⚠️ `docs/SSO_*.md` (SSO 관련 문서, 제거 가능)

---

## 🎯 결론

**문제없이 작동합니다!**

2FA와 SSO는 완전히 독립적이므로:
1. main 브랜치에서 2FA 브랜치 생성
2. sso 브랜치에서 2FA 관련 파일만 가져오기
3. SSO 관련 코드는 그대로 두어도 됨 (사용 안 함)

**권장 방법**: 방법 1 (커밋 후 분리) - 더 깔끔하고 추적 가능

---

**작성일**: 2025년 12월 10일

