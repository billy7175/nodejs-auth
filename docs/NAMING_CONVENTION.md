# 📝 문서 명명 규칙

## 🎯 목적

문서 이름만 보고도 문서의 유형을 쉽게 구분할 수 있도록 명명 규칙을 정의합니다.

---

## 📋 명명 규칙

### 접미사 (Suffix) 규칙

| 접미사 | 의미 | 예시 |
|--------|------|------|
| `_GUIDE` | 사용자 가이드 (How-to) | `2FA_GUIDE.md` |
| `_SETUP` | 설정 방법 | `SSO_SETUP.md` |
| `_STATUS` | 현재 상태 설명 | `2FA_STATUS.md` |
| `_REFERENCE` | 참고 자료/데이터 구조 | `QR_CODE_REFERENCE.md` |
| `_TROUBLESHOOTING` | 문제 해결 | `2FA_TROUBLESHOOTING.md` |
| `_ANALYSIS` | 분석 리포트 | `2FA_ROOT_CAUSE_ANALYSIS.md` |
| `_ARCHITECTURE` | 설계 문서 | `ARCHITECTURE.md` |
| `_SCENARIOS` | 시나리오 설명 | `SSO_SCENARIOS.md` |
| `_FLOW` | 플로우 상세 | `SSO_FLOW_DETAIL.md` |
| `_STRATEGY` | 전략 문서 | `GIT_BRANCH_STRATEGY.md` |

---

## 📂 문서 분류

### 가이드 (GUIDE)
사용자가 따라할 수 있는 단계별 가이드

- `2FA_GUIDE.md` - 2FA 사용자 가이드
- `AUTH_TESTING_GUIDE.md` - 인증 테스트 가이드
- `SSO_UI_GUIDE.md` - SSO UI 가이드
- `FRONTEND_ACCESS.md` - 프론트엔드 접속 가이드

### 설정 (SETUP)
설정 방법 및 설치 가이드

- `SSO_SETUP.md` - SSO 설정 방법

### 상태/설명 (STATUS/EXPLANATION)
현재 상태나 동작 방식 설명

- `2FA_ACTIVATION_EXPLANATION.md` → `2FA_STATUS.md`
- `QR_CODE_DATA_EXPLANATION.md` → `QR_CODE_REFERENCE.md`
- `FRONTEND_STRUCTURE.md` - 구조 설명 (유지)

### 문제 해결 (TROUBLESHOOTING)
문제 발생 시 해결 방법

- `2FA_FIX_EXPLANATION.md` → `2FA_TROUBLESHOOTING.md`

### 분석 (ANALYSIS)
문제 분석 리포트

- `2FA_ROOT_CAUSE_ANALYSIS.md` - 근본 원인 분석

### 설계 (ARCHITECTURE/DESIGN)
시스템 설계 문서

- `ARCHITECTURE.md` - 기본 설계
- `ADVANCED_AUTH.md` - 고급 인증 설계

### 시나리오/플로우 (SCENARIOS/FLOW)
동작 시나리오 및 플로우 설명

- `SSO_SCENARIOS.md` - SSO 시나리오
- `SSO_FLOW_DETAIL.md` - SSO 플로우 상세

### 참고 (REFERENCE)
참고 자료 및 데이터 구조

- `PACKAGES.md` - 패키지 설명
- `NO_UI_TESTING.md` - 테스트 방법

### 전략 (STRATEGY)
개발 전략 문서

- `GIT_BRANCH_STRATEGY.md` - Git 브랜치 전략

---

## 🔄 변경 제안

### 현재 → 변경 후

| 현재 이름 | 변경 후 | 이유 |
|----------|---------|------|
| `2FA_ACTIVATION_EXPLANATION.md` | `2FA_STATUS.md` | 상태 설명이므로 STATUS |
| `QR_CODE_DATA_EXPLANATION.md` | `QR_CODE_REFERENCE.md` | 참고 자료이므로 REFERENCE |
| `2FA_FIX_EXPLANATION.md` | `2FA_TROUBLESHOOTING.md` | 문제 해결이므로 TROUBLESHOOTING |

---

## ✅ 최종 문서 목록 (변경 후)

### 2FA 관련
- `2FA_GUIDE.md` - 사용자 가이드
- `2FA_STATUS.md` - 활성화 후 상태
- `QR_CODE_REFERENCE.md` - QR 코드 데이터 구조
- `2FA_TROUBLESHOOTING.md` - 문제 해결
- `2FA_ROOT_CAUSE_ANALYSIS.md` - 근본 원인 분석

### SSO 관련
- `SSO_SETUP.md` - 설정 방법
- `SSO_SCENARIOS.md` - 시나리오
- `SSO_FLOW_DETAIL.md` - 플로우 상세
- `SSO_UI_GUIDE.md` - UI 가이드

### 기타
- `ARCHITECTURE.md` - 기본 설계
- `ADVANCED_AUTH.md` - 고급 인증 설계
- `PACKAGES.md` - 패키지 설명
- `AUTH_TESTING_GUIDE.md` - 테스트 가이드
- `NO_UI_TESTING.md` - 테스트 방법
- `FRONTEND_ACCESS.md` - 프론트엔드 접속
- `FRONTEND_STRUCTURE.md` - 프론트엔드 구조
- `GIT_BRANCH_STRATEGY.md` - Git 전략

---

**작성일**: 2025년 12월 10일

