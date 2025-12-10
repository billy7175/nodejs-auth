# 📚 문서 인덱스

> 프로젝트 문서를 카테고리별로 정리한 가이드입니다.

---

## 🎯 빠른 시작 가이드

### 처음 시작하는 경우

1. **[README.md](../README.md)** - 프로젝트 개요 및 시작하기
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 기본 설계 및 구조
3. **[PACKAGES.md](./PACKAGES.md)** - 사용된 패키지 설명

### 특정 기능을 이해하려는 경우

- **2FA (2단계 인증)**: 아래 "2FA 관련" 섹션 참고
- **SSO (Single Sign-On)**: 아래 "SSO 관련" 섹션 참고
- **테스트 방법**: 아래 "테스트 관련" 섹션 참고

---

## 📂 문서 카테고리

### 1. 기본 설계 및 구조

| 문서 | 설명 | 읽기 순서 |
|------|------|----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 기본 인증 시스템 설계 (JWT, 비밀번호 암호화 등) | 1️⃣ |
| **[ADVANCED_AUTH.md](./ADVANCED_AUTH.md)** | 고급 인증 기능 설계 (OTP, Passkey, SSO 등) | 2️⃣ |
| **[PACKAGES.md](./PACKAGES.md)** | 프로젝트에서 사용하는 모든 패키지 설명 | 3️⃣ |

---

### 2. 2FA (2단계 인증) 관련

> **⚠️ 중요**: 2FA 관련 문서가 많습니다. 읽기 순서를 따라주세요.

| 문서 | 설명 | 읽기 순서 | 상태 |
|------|------|----------|------|
| **[2FA_GUIDE.md](./2FA_GUIDE.md)** | 2FA 사용자 가이드 (Google Authenticator 사용법) | 1️⃣ | ✅ 정확 |
| **[2FA_STATUS.md](./2FA_STATUS.md)** | 2FA 활성화 후 달라지는 점 및 현재 상태 | 2️⃣ | ✅ 정확 |
| **[QR_CODE_REFERENCE.md](./QR_CODE_REFERENCE.md)** | QR 코드 데이터 구조 및 스캔 과정 | 3️⃣ | ✅ 정확 |
| **[2FA_TROUBLESHOOTING.md](./2FA_TROUBLESHOOTING.md)** | 2FA 검증 실패 문제 해결 | 4️⃣ | ✅ **최종 정확** |
| **[2FA_ROOT_CAUSE_ANALYSIS.md](./2FA_ROOT_CAUSE_ANALYSIS.md)** | 2FA 문제 근본 원인 분석 (중간 분석) | 5️⃣ | ⚠️ 부분 정확 |

**📌 요약:**
- **빠른 이해**: 2FA_GUIDE → 2FA_STATUS
- **문제 해결**: 2FA_TROUBLESHOOTING (✅ 최종 정확한 해결책)
- **상세 분석**: 2FA_ROOT_CAUSE_ANALYSIS (⚠️ 중간 분석, 참고용)

**⚠️ 주의:**
- `2FA_ROOT_CAUSE_ANALYSIS.md`: 중간 분석 (최종 해결책은 아님, 참고용)
- `2FA_TROUBLESHOOTING.md`: **최종 정확한 해결책** ✅

---

### 3. SSO (Single Sign-On) 관련

| 문서 | 설명 | 읽기 순서 |
|------|------|----------|
| **[SSO_SETUP.md](./SSO_SETUP.md)** | Keycloak SSO 설정 가이드 | 1️⃣ |
| **[SSO_SCENARIOS.md](./SSO_SCENARIOS.md)** | SSO 활성화/비활성화 시나리오 | 2️⃣ |
| **[SSO_FLOW_DETAIL.md](./SSO_FLOW_DETAIL.md)** | SSO "한 번 로그인" 플로우 상세 설명 | 3️⃣ |
| **[SSO_UI_GUIDE.md](./SSO_UI_GUIDE.md)** | SSO 활성화에 따른 UI 가이드 | 4️⃣ |

**📌 요약:**
- **설정 방법**: SSO_SETUP
- **동작 이해**: SSO_SCENARIOS → SSO_FLOW_DETAIL

---

### 4. 테스트 관련

| 문서 | 설명 | 읽기 순서 |
|------|------|----------|
| **[NO_UI_TESTING.md](./NO_UI_TESTING.md)** | 프론트엔드 없이 테스트하는 방법 | 1️⃣ |
| **[AUTH_TESTING_GUIDE.md](./AUTH_TESTING_GUIDE.md)** | 인증 기능 테스트 가이드 | 2️⃣ |

**📌 요약:**
- **테스트 방법**: NO_UI_TESTING
- **기능별 테스트**: AUTH_TESTING_GUIDE

---

### 5. 프론트엔드 관련

| 문서 | 설명 | 읽기 순서 |
|------|------|----------|
| **[FRONTEND_ACCESS.md](./FRONTEND_ACCESS.md)** | 프론트엔드 테스트 페이지 접속 방법 | 1️⃣ |
| **[FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md)** | 프론트엔드 구조 설명 | 2️⃣ |

**📌 요약:**
- **접속 방법**: FRONTEND_ACCESS
- **구조 이해**: FRONTEND_STRUCTURE

---

### 6. 개발 관련

| 문서 | 설명 | 읽기 순서 |
|------|------|----------|
| **[GIT_BRANCH_STRATEGY.md](./GIT_BRANCH_STRATEGY.md)** | Git 브랜치 전략 (main, sso 등) | 1️⃣ |

---

## 🗺️ 읽기 경로 추천

### 시나리오 1: 프로젝트 처음 시작

```
1. README.md (프로젝트 루트)
2. ARCHITECTURE.md
3. PACKAGES.md
4. FRONTEND_ACCESS.md (테스트 페이지 사용)
```

### 시나리오 2: 2FA 기능 이해

```
1. 2FA_GUIDE.md (사용법)
2. 2FA_STATUS.md (현재 상태)
3. QR_CODE_REFERENCE.md (데이터 구조)
```

### 시나리오 3: 2FA 문제 해결

```
1. 2FA_TROUBLESHOOTING.md (✅ 최종 정확한 해결책)
2. 2FA_ROOT_CAUSE_ANALYSIS.md (⚠️ 중간 분석, 참고용)
```


### 시나리오 4: SSO 기능 이해

```
1. SSO_SETUP.md (설정 방법)
2. SSO_SCENARIOS.md (동작 시나리오)
3. SSO_FLOW_DETAIL.md (상세 플로우)
```

### 시나리오 5: 테스트 방법

```
1. NO_UI_TESTING.md (테스트 방법)
2. AUTH_TESTING_GUIDE.md (기능별 테스트)
```

---

## 📊 문서 통계

- **총 문서 수**: 17개
- **기본 설계**: 3개
- **2FA 관련**: 5개
- **SSO 관련**: 4개
- **테스트 관련**: 2개
- **프론트엔드**: 2개
- **개발**: 1개

---

## 🔍 문서 검색

### 특정 주제 찾기

- **"QR 코드"**: QR_CODE_REFERENCE.md
- **"로그인 플로우"**: SSO_FLOW_DETAIL.md, 2FA_STATUS.md
- **"설정 방법"**: SSO_SETUP.md, FRONTEND_ACCESS.md
- **"문제 해결"**: 2FA_TROUBLESHOOTING.md, 2FA_ROOT_CAUSE_ANALYSIS.md
- **"테스트"**: NO_UI_TESTING.md, AUTH_TESTING_GUIDE.md

---

## ⚠️ 중요 문서

### 반드시 읽어야 할 문서

1. **[README.md](../README.md)** - 프로젝트 시작
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 기본 구조 이해

### 문제 발생 시 참고

1. **[2FA_TROUBLESHOOTING.md](./2FA_TROUBLESHOOTING.md)** - ✅ 2FA 문제 해결 (최종 정확)
2. **[SSO_SETUP.md](./SSO_SETUP.md)** - SSO 설정 문제

**⚠️ 참고 문서:**
- `2FA_ROOT_CAUSE_ANALYSIS.md`: 중간 분석 (Secret 검증 부재가 원인, 하지만 최종 해결책은 아님)

---

## 📝 문서 업데이트 가이드

새 문서를 추가할 때:

1. 이 인덱스에 추가
2. 적절한 카테고리에 배치
3. 읽기 순서 명시
4. 관련 문서와 연결

---

## 🏷️ 문서 명명 규칙

> **📋 [명명 규칙 상세](./NAMING_CONVENTION.md)** - 문서 이름 규칙 전체 설명

### 접미사 (Suffix) 규칙

| 접미사 | 의미 | 예시 |
|--------|------|------|
| `_GUIDE` | 사용자 가이드 | `2FA_GUIDE.md` |
| `_SETUP` | 설정 방법 | `SSO_SETUP.md` |
| `_STATUS` | 현재 상태 설명 | `2FA_STATUS.md` |
| `_REFERENCE` | 참고 자료 | `QR_CODE_REFERENCE.md` |
| `_TROUBLESHOOTING` | 문제 해결 | `2FA_TROUBLESHOOTING.md` |
| `_ANALYSIS` | 분석 리포트 | `2FA_ROOT_CAUSE_ANALYSIS.md` |
| `_ARCHITECTURE` | 설계 문서 | `ARCHITECTURE.md` |
| `_SCENARIOS` | 시나리오 | `SSO_SCENARIOS.md` |
| `_FLOW` | 플로우 상세 | `SSO_FLOW_DETAIL.md` |

**규칙:**
- 가이드: `_GUIDE` - 사용자가 따라할 수 있는 단계별 가이드
- 설정: `_SETUP` - 설정 방법 및 설치 가이드
- 상태: `_STATUS` - 현재 상태나 동작 방식 설명
- 참고: `_REFERENCE` - 참고 자료 및 데이터 구조
- 문제 해결: `_TROUBLESHOOTING` - 문제 발생 시 해결 방법
- 분석: `_ANALYSIS` - 문제 분석 리포트

---

**마지막 업데이트**: 2025년 12월 10일

