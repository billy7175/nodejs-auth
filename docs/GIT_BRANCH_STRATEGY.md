# 🌿 Git 브랜치 전략

## 📋 브랜치 구조

```
main (기본 인증만)
  ├─ JWT 인증
  ├─ 회원가입/로그인
  └─ 기본 기능

sso (SSO 기능 포함)
  ├─ main의 모든 기능
  └─ Keycloak SSO 통합
```

---

## 🎯 전략 옵션

### 옵션 1: SSO를 별도 브랜치로 분리 (권장)

**장점:**
- main 브랜치가 깔끔하게 유지됨
- SSO 기능을 독립적으로 개발/테스트 가능
- 필요시 main에 병합 가능

**단점:**
- 두 브랜치를 동시에 관리해야 함

---

### 옵션 2: main에 유지하고 feature flag로 제어

**장점:**
- 하나의 브랜치만 관리
- SSO 활성화/비활성화가 쉬움

**단점:**
- main 브랜치가 복잡해짐
- SSO 코드가 항상 포함됨

---

## 💻 실행 계획 (옵션 1)

### 1단계: 현재 SSO 변경사항 커밋

```bash
# SSO 브랜치 생성 및 전환
git checkout -b sso

# SSO 관련 변경사항 커밋
git add .
git commit -m "feat: Keycloak SSO 통합 기능 추가"
```

---

### 2단계: main 브랜치로 돌아가서 SSO 제거

```bash
# main 브랜치로 전환
git checkout main

# main은 SSO 없는 상태로 유지
# (이미 SSO가 커밋되지 않았으므로 그대로 유지)
```

---

### 3단계: 브랜치 확인

```bash
# 브랜치 목록 확인
git branch

# main: SSO 없음
# sso: SSO 포함
```

---

## 🔄 작업 흐름

### 기본 인증 개발 (main 브랜치)

```bash
git checkout main
# 기본 인증 기능 개발
git add .
git commit -m "feat: 새로운 인증 기능"
```

---

### SSO 개발 (sso 브랜치)

```bash
git checkout sso
# SSO 기능 개발
git add .
git commit -m "feat: SSO 기능 개선"
```

---

### main의 변경사항을 sso에 반영

```bash
git checkout sso
git merge main
# 또는
git rebase main
```

---

## 📊 브랜치 비교

| 브랜치 | 목적 | 포함 기능 |
|--------|------|----------|
| **main** | 기본 인증 | JWT, 회원가입, 로그인 |
| **sso** | SSO 통합 | main + Keycloak SSO |

---

## 🎯 권장 사항

**현재 상황:**
- SSO 변경사항이 아직 커밋되지 않음 ✅
- main 브랜치가 깔끔한 상태 ✅

**권장 작업:**
1. `sso` 브랜치 생성
2. SSO 변경사항 커밋
3. main은 그대로 유지 (SSO 없음)

**이유:**
- main 브랜치가 기본 인증만 포함하여 깔끔함
- SSO는 별도 브랜치에서 독립적으로 개발 가능
- 필요시 나중에 병합 가능

---

## 🚀 원격 저장소 연결 후 단계별 가이드

### 1단계: 원격 저장소 생성

**GitHub / GitLab / Bitbucket 등에서:**
1. 새 저장소 생성
2. 저장소 URL 복사
   - 예: `https://github.com/username/nodejs-auth.git`
   - 또는: `git@github.com:username/nodejs-auth.git`

---

### 2단계: 원격 저장소 연결

```bash
# 원격 저장소 추가
git remote add origin <저장소-URL>

# 예시
git remote add origin https://github.com/username/nodejs-auth.git

# 연결 확인
git remote -v
```

**출력 예시:**
```
origin  https://github.com/username/nodejs-auth.git (fetch)
origin  https://github.com/username/nodejs-auth.git (push)
```

---

### 3단계: main 브랜치 push

```bash
# main 브랜치로 전환
git checkout main

# main 브랜치 push (첫 push)
git push -u origin main
```

**설명:**
- `-u` (--set-upstream): 추적 브랜치 설정
- 이후 `git push`만으로도 push 가능

---

### 4단계: sso 브랜치 push

```bash
# sso 브랜치로 전환
git checkout sso

# sso 브랜치 push (첫 push)
git push -u origin sso
```

---

### 5단계: 브랜치 확인

```bash
# 원격 브랜치 확인
git branch -r

# 모든 브랜치 확인 (로컬 + 원격)
git branch -a
```

**출력 예시:**
```
* main
  sso
  remotes/origin/main
  remotes/origin/sso
```

---

## 📝 이후 작업 흐름

### main 브랜치 작업 후 push

```bash
# main 브랜치로 전환
git checkout main

# 작업 및 커밋
git add .
git commit -m "feat: 기본 인증 기능 개선"

# push
git push
```

---

### sso 브랜치 작업 후 push

```bash
# sso 브랜치로 전환
git checkout sso

# 작업 및 커밋
git add .
git commit -m "feat: SSO 기능 개선"

# push
git push
```

---

## 🔄 브랜치 동기화

### main의 변경사항을 sso에 반영

```bash
# sso 브랜치로 전환
git checkout sso

# main 브랜치 병합
git merge main

# 또는 rebase (선택사항)
git rebase main

# push
git push
```

---

## ⚠️ 주의사항

### 1. 첫 push 전 확인

```bash
# 현재 브랜치 확인
git branch

# 커밋 내역 확인
git log --oneline

# 원격 저장소 연결 확인
git remote -v
```

---

### 2. 충돌 해결

```bash
# pull 시 충돌 발생 시
git pull origin main

# 충돌 파일 수정 후
git add .
git commit -m "fix: 충돌 해결"
git push
```

---

### 3. 원격 저장소 URL 변경

```bash
# 기존 원격 저장소 제거
git remote remove origin

# 새로운 원격 저장소 추가
git remote add origin <새-저장소-URL>
```

---

## 📋 체크리스트

### 원격 저장소 연결 전
- [ ] 로컬에서 모든 브랜치 커밋 완료
- [ ] 브랜치 구조 확인 (`git branch`)
- [ ] 원격 저장소 생성 완료

### 원격 저장소 연결 후
- [ ] `git remote add origin <URL>` 실행
- [ ] `git remote -v`로 연결 확인
- [ ] `git push -u origin main` 실행
- [ ] `git push -u origin sso` 실행
- [ ] `git branch -a`로 브랜치 확인

---

## 🎯 요약

```bash
# 1. 원격 저장소 추가
git remote add origin <저장소-URL>

# 2. main 브랜치 push
git checkout main
git push -u origin main

# 3. sso 브랜치 push
git checkout sso
git push -u origin sso

# 완료! ✅
```

이제 두 브랜치 모두 원격 저장소에 업로드되었습니다!

