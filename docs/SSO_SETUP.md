# 🔐 SSO (Keycloak) 설정 가이드

## ✅ 1단계: Keycloak 실행 확인

```bash
# Keycloak 컨테이너 상태 확인
docker ps | grep keycloak

# 로그 확인
docker logs keycloak
```

**정상 실행 시:**
- 포트 8080에서 접근 가능
- `http://localhost:8080` 접속 시 Keycloak 페이지 표시

---

## 🔑 2단계: Keycloak Admin Console 접속

1. **브라우저에서 접속:**
   ```
   http://localhost:8080
   ```

2. **관리자 로그인:**
   - Username: `admin`
   - Password: `admin` (또는 Docker 실행 시 설정한 비밀번호)

3. **Admin Console 접속:**
   - 우측 상단 "Administration Console" 클릭
   - 또는 직접: `http://localhost:8080/admin`

---

## 🏛️ 3단계: Realm 생성

1. **Realm 선택 드롭다운 클릭** (왼쪽 상단)
2. **"Create Realm"** 클릭
3. **Realm 이름 입력:** `my-realm` (또는 원하는 이름)
4. **Enabled: ON** 확인
5. **"Create"** 클릭

---

## 📱 4단계: Client 생성

1. 왼쪽 메뉴: **"Clients"** 클릭
2. **"Create client"** 클릭
3. **General Settings:**
   - Client type: `OpenID Connect`
   - Client ID: `my-app` (또는 원하는 이름)
   - **"Next"** 클릭

4. **Capability config:**
   - Client authentication: `OFF` (Public client)
   - Authorization: `OFF`
   - **"Next"** 클릭

5. **Login settings:**
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
   - **"Save"** 클릭

---

## ⚙️ 5단계: 백엔드 환경 변수 설정

`.env` 파일에 다음 추가:

```env
# SSO 활성화
SSO_ENABLED=true

# Keycloak 설정
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=my-realm
KEYCLOAK_CLIENT_ID=my-app

# 세션 시크릿
SESSION_SECRET=your-session-secret-key-change-this

# 앱 URL
APP_URL=http://localhost:3000
```

---

## 🧪 6단계: 테스트

### 6-1. 백엔드 서버 실행

```bash
cd backend
npm run dev
```

**정상 실행 시 콘솔에:**
```
🔐 SSO 모드 활성화
✅ Keycloak SSO 초기화 완료
   📌 Realm: my-realm
   📌 URL: http://localhost:8080/
   📌 Client: my-app
```

### 6-2. SSO 상태 확인

```bash
curl http://localhost:3000/api/sso/status
```

**예상 응답:**
```json
{
  "success": true,
  "message": "SSO 상태 조회",
  "data": {
    "enabled": true,
    "provider": "Keycloak",
    "loginUrl": "/api/sso/login"
  }
}
```

### 6-3. SSO 로그인 테스트

**브라우저에서:**
```
http://localhost:3000/api/sso/login
```

**예상 동작:**
1. Keycloak 로그인 페이지로 리다이렉트
2. 사용자 생성 또는 로그인
3. `/api/sso/callback`으로 리다이렉트
4. JWT 토큰 발급

---

## 👤 7단계: Keycloak 사용자 생성

1. Keycloak Admin Console 접속
2. 왼쪽 메뉴: **"Users"** 클릭
3. **"Create new user"** 클릭
4. **Username:** `testuser`
5. **Email:** `test@example.com`
6. **Email verified:** `ON`
7. **"Create"** 클릭

8. **"Credentials"** 탭 클릭
9. **"Set password"** 클릭
10. **Password:** 원하는 비밀번호 입력
11. **Temporary:** `OFF` (영구 비밀번호)
12. **"Save"** 클릭

---

## 🔍 8단계: 문제 해결

### Keycloak 접속 안 됨

```bash
# 컨테이너 재시작
docker restart keycloak

# 포트 확인
lsof -i :8080
```

### "SSO_NOT_INITIALIZED" 에러

- `.env` 파일의 `SSO_ENABLED=true` 확인
- Keycloak URL이 올바른지 확인
- Realm/Client ID가 일치하는지 확인

### 리다이렉트 URI 에러

- Keycloak Client 설정에서 Valid redirect URIs 확인
- `http://localhost:3000/*` 포함되어 있는지 확인

---

## 📊 체크리스트

- [ ] Keycloak Docker 실행 중
- [ ] Admin Console 접속 가능
- [ ] Realm 생성 완료
- [ ] Client 생성 완료
- [ ] 백엔드 `.env` 설정 완료
- [ ] 백엔드 서버 실행 중
- [ ] `/api/sso/status` 응답 확인
- [ ] Keycloak 사용자 생성 완료
- [ ] `/api/sso/login` 테스트 성공

---

## 🎯 다음 단계

SSO가 정상 작동하면:
1. 여러 서비스에 SSO 연동 테스트
2. 세션 관리 확인
3. 로그아웃 플로우 테스트

