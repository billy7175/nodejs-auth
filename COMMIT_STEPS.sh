#!/bin/bash
# 기능 단위 커밋 스크립트

echo "🚀 기능 단위 커밋 시작..."

# 1. 2FA 핵심 기능
echo "📦 커밋 1: 2FA 핵심 기능 구현"
git add backend/src/controllers/twoFAController.js
git add backend/src/routes/twoFARoutes.js
git add backend/src/models/User.js
git commit -m "feat: 2FA 핵심 기능 구현

- TOTP 기반 2FA 설정/검증/비활성화/초기화 API 추가
- User 모델에 totpSecret, is2FAEnabled, backupCodes 필드 추가
- speakeasy와 qrcode 패키지 사용"

# 2. 2FA 프론트엔드
echo "📦 커밋 2: 2FA 프론트엔드 테스트 페이지"
git add backend/public/2fa-setup.html
git add backend/public/index.html
git add backend/public/passkey.html
git commit -m "feat: 2FA 프론트엔드 테스트 페이지 추가

- 2FA 설정/검증 UI (2fa-setup.html)
- 인증 테스트 메인 페이지 (index.html)
- Passkey 테스트 페이지 (passkey.html)"

# 3. app.js - 2FA 라우트 및 정적 파일 서빙
echo "📦 커밋 3: 2FA 라우트 및 정적 파일 서빙 설정"
# app.js의 일부만 추가하려면 git add -p 사용
# 여기서는 전체를 추가하고, 필요시 수정
git add -p backend/src/app.js
# 또는 전체 추가 후 설명에 포함
git add backend/src/app.js
git commit -m "feat: 2FA 라우트 및 정적 파일 서빙 설정

- 2FA 라우트 추가 (/api/auth/2fa)
- 정적 파일 서빙 설정 (프론트엔드 테스트 페이지)
- path 모듈 import 추가"

# 4. CSP 관련
echo "📦 커밋 4: CSP 설정 및 문서화"
# 이미 app.js가 커밋되었으므로, CSP 주석은 별도로 추가 불가
# 대신 CSP_EXPLANATION.md만 추가
git add docs/CSP_EXPLANATION.md
git commit -m "docs: CSP 비활성화 이유 문서화

- CSP를 false로 설정한 이유 상세 설명
- React/Vue 사용 시 차이점 설명
- 프로덕션 배포 시 주의사항"

# 5. 2FA 관련 문서
echo "📦 커밋 5: 2FA 관련 문서"
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

# 6. 프론트엔드 및 테스트 문서
echo "📦 커밋 6: 프론트엔드 및 테스트 가이드"
git add docs/AUTH_TESTING_GUIDE.md
git add docs/FRONTEND_ACCESS.md
git add docs/FRONTEND_STRUCTURE.md
git add docs/NO_UI_TESTING.md
git commit -m "docs: 프론트엔드 및 테스트 가이드 추가

- 프론트엔드 구조 설명
- 테스트 페이지 접근 방법
- UI 없이 테스트하는 방법"

# 7. Git 및 프로젝트 관리 문서
echo "📦 커밋 7: Git 전략 및 문서 관리"
git add docs/BRANCH_MIGRATION_GUIDE.md
git add docs/GIT_BRANCH_STRATEGY.md
git add docs/NAMING_CONVENTION.md
git add docs/README.md
git commit -m "docs: Git 전략 및 문서 관리 가이드

- 브랜치 전략 및 마이그레이션 가이드
- 문서 네이밍 컨벤션
- 문서 인덱스 업데이트"

# 8. 의존성 및 설정
echo "📦 커밋 8: 의존성 및 설정 업데이트"
git add backend/package.json
git add backend/package-lock.json
git add backend/server.js
git add README.md
git commit -m "chore: 2FA 기능을 위한 의존성 및 설정 업데이트

- speakeasy, qrcode 패키지 추가
- 서버 시작 시 프론트엔드 URL 로그 추가
- README 프로젝트 구조 업데이트"

echo "✅ 모든 커밋 완료!"
echo "📊 커밋 히스토리 확인: git log --oneline -8"

