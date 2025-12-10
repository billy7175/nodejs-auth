# 📝 커밋 전략: 기능 단위로 분리

## 현재 변경사항 분석

### 1️⃣ 2FA 핵심 기능 (백엔드)
- `backend/src/controllers/twoFAController.js` (새 파일)
- `backend/src/routes/twoFARoutes.js` (새 파일)
- `backend/src/models/User.js` (2FA 필드 추가)

### 2️⃣ 2FA 프론트엔드 (테스트 페이지)
- `backend/public/2fa-setup.html` (새 파일)
- `backend/public/index.html` (새 파일)
- `backend/public/passkey.html` (새 파일)

### 3️⃣ SSO 제거 (2FA 브랜치 정리)
- `backend/src/app.js` (SSO import 제거)

### 4️⃣ CSP 관련 (설명 추가)
- `backend/src/app.js` (CSP 주석 추가)
- `docs/CSP_EXPLANATION.md` (새 파일)

### 5️⃣ 문서 정리
- `docs/2FA_GUIDE.md`
- `docs/2FA_ROOT_CAUSE_ANALYSIS.md`
- `docs/2FA_STATUS.md`
- `docs/2FA_TROUBLESHOOTING.md`
- `docs/QR_CODE_REFERENCE.md`
- `docs/AUTH_TESTING_GUIDE.md`
- `docs/BRANCH_MIGRATION_GUIDE.md`
- `docs/FRONTEND_ACCESS.md`
- `docs/FRONTEND_STRUCTURE.md`
- `docs/GIT_BRANCH_STRATEGY.md`
- `docs/NAMING_CONVENTION.md`
- `docs/NO_UI_TESTING.md`
- `docs/README.md`

### 6️⃣ 기타 설정
- `backend/package.json` (2FA 패키지 추가)
- `backend/package-lock.json`
- `backend/server.js` (프론트엔드 URL 로그 추가)
- `README.md` (프로젝트 구조 업데이트)

---

## 권장 커밋 순서

### 커밋 1: 2FA 핵심 기능 구현
```bash
git add backend/src/controllers/twoFAController.js
git add backend/src/routes/twoFARoutes.js
git add backend/src/models/User.js
git commit -m "feat: 2FA 핵심 기능 구현

- TOTP 기반 2FA 설정/검증/비활성화/초기화 API 추가
- User 모델에 totpSecret, is2FAEnabled, backupCodes 필드 추가
- speakeasy와 qrcode 패키지 사용"
```

### 커밋 2: 2FA 프론트엔드 테스트 페이지
```bash
git add backend/public/2fa-setup.html
git add backend/public/index.html
git add backend/public/passkey.html
git commit -m "feat: 2FA 프론트엔드 테스트 페이지 추가

- 2FA 설정/검증 UI (2fa-setup.html)
- 인증 테스트 메인 페이지 (index.html)
- Passkey 테스트 페이지 (passkey.html)"
```

### 커밋 3: SSO 관련 코드 제거
```bash
git add backend/src/app.js
git commit -m "refactor: 2FA 브랜치에서 SSO 관련 코드 제거

- SSO import 및 라우트 제거
- 2FA 브랜치를 SSO와 독립적으로 유지"
```

### 커밋 4: CSP 설정 및 문서화
```bash
git add backend/src/app.js  # CSP 주석 추가
git add docs/CSP_EXPLANATION.md
git commit -m "docs: CSP 비활성화 이유 및 상세 주석 추가

- CSP를 false로 설정한 이유 문서화
- app.js에 상세 주석 추가
- React/Vue 사용 시 차이점 설명"
```

### 커밋 5: 2FA 관련 문서
```bash
git add docs/2FA_GUIDE.md
git add docs/2FA_ROOT_CAUSE_ANALYSIS.md
git add docs/2FA_STATUS.md
git add docs/2FA_TROUBLESHOOTING.md
git add docs/QR_CODE_REFERENCE.md
git commit -m "docs: 2FA 관련 문서 추가

- 2FA 설정 가이드
- 문제 해결 및 원인 분석
- QR 코드 데이터 설명
- 2FA 상태 설명"
```

### 커밋 6: 프론트엔드 및 테스트 관련 문서
```bash
git add docs/AUTH_TESTING_GUIDE.md
git add docs/FRONTEND_ACCESS.md
git add docs/FRONTEND_STRUCTURE.md
git add docs/NO_UI_TESTING.md
git commit -m "docs: 프론트엔드 및 테스트 가이드 추가

- 프론트엔드 구조 설명
- 테스트 페이지 접근 방법
- UI 없이 테스트하는 방법"
```

### 커밋 7: Git 및 프로젝트 관리 문서
```bash
git add docs/BRANCH_MIGRATION_GUIDE.md
git add docs/GIT_BRANCH_STRATEGY.md
git add docs/NAMING_CONVENTION.md
git add docs/README.md
git commit -m "docs: Git 전략 및 문서 관리 가이드

- 브랜치 전략 및 마이그레이션 가이드
- 문서 네이밍 컨벤션
- 문서 인덱스 업데이트"
```

### 커밋 8: 의존성 및 설정 업데이트
```bash
git add backend/package.json
git add backend/package-lock.json
git add backend/server.js
git add README.md
git commit -m "chore: 2FA 기능을 위한 의존성 및 설정 업데이트

- speakeasy, qrcode 패키지 추가
- 서버 시작 시 프론트엔드 URL 로그 추가
- README 프로젝트 구조 업데이트"
```

---

## 실행 방법

### 방법 1: 수동으로 하나씩 커밋 (권장)

위의 커밋 순서대로 하나씩 실행하세요.

### 방법 2: 스크립트 사용

```bash
# 모든 staged 파일 unstage
git reset

# 그 다음 위의 커밋 순서대로 실행
```

---

## 커밋 메시지 컨벤션

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `refactor`: 코드 리팩토링
- `chore`: 빌드/설정 변경

---

**작성일**: 2025년 12월 10일

