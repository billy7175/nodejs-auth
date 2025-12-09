# 🎨 SSO 활성화에 따른 UI 가이드

## 📋 UI 분기 전략

### 옵션 1: SSO 상태에 따라 완전 분리 (권장)

```
SSO 비활성화:
  → 일반 로그인 UI만 표시
  [이메일 입력] [비밀번호 입력] [로그인 버튼]

SSO 활성화:
  → SSO 로그인 UI만 표시
  [SSO 로그인 버튼] → Keycloak으로 리다이렉트
```

---

### 옵션 2: 둘 다 제공 (하이브리드)

```
SSO 활성화:
  → SSO 로그인 + 일반 로그인 둘 다 표시
  [SSO 로그인 버튼] 또는 [일반 로그인 폼]
```

---

## 🔍 현재 백엔드 구조

### SSO 비활성화 시

```
POST /api/auth/login ✅ (일반 로그인)
GET /api/sso/login ❌ (SSO 비활성화 에러)
```

**UI 필요:**
- 일반 로그인 폼만

---

### SSO 활성화 시

```
POST /api/auth/login ⚠️ (SSO 사용자는 비밀번호 없어서 실패)
GET /api/sso/login ✅ (SSO 로그인)
```

**UI 필요:**
- SSO 로그인 버튼만 (권장)
- 또는 둘 다 제공 (하이브리드)

---

## 💻 프론트엔드 구현 예시

### 1. SSO 상태 확인 API

```javascript
// SSO 상태 확인
const checkSsoStatus = async () => {
  const response = await fetch('/api/sso/status');
  const data = await response.json();
  return data.data.enabled; // true/false
};
```

---

### 2. 조건부 UI 렌더링

#### React 예시 (옵션 1: 완전 분리)

```jsx
function LoginPage() {
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSsoStatus().then(enabled => {
      setSsoEnabled(enabled);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  // SSO 활성화 시
  if (ssoEnabled) {
    return (
      <div>
        <h2>SSO 로그인</h2>
        <button onClick={() => window.location.href = '/api/sso/login'}>
          SSO로 로그인
        </button>
      </div>
    );
  }

  // SSO 비활성화 시
  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="이메일" />
        <input type="password" placeholder="비밀번호" />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}
```

---

#### React 예시 (옵션 2: 하이브리드)

```jsx
function LoginPage() {
  const [ssoEnabled, setSsoEnabled] = useState(false);

  useEffect(() => {
    checkSsoStatus().then(enabled => setSsoEnabled(enabled));
  }, []);

  return (
    <div>
      <h2>로그인</h2>
      
      {/* SSO 활성화 시 SSO 버튼 표시 */}
      {ssoEnabled && (
        <div>
          <button onClick={() => window.location.href = '/api/sso/login'}>
            SSO로 로그인
          </button>
          <hr />
          <p>또는</p>
        </div>
      )}
      
      {/* 일반 로그인 폼 (항상 표시) */}
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="이메일" />
        <input type="password" placeholder="비밀번호" />
        <button type="submit">일반 로그인</button>
      </form>
    </div>
  );
}
```

---

## 📊 UI 비교표

| SSO 상태 | 표시할 UI | 설명 |
|---------|----------|------|
| **비활성화** | 일반 로그인 폼만 | email, password 입력 |
| **활성화 (옵션 1)** | SSO 버튼만 | "SSO로 로그인" 버튼 |
| **활성화 (옵션 2)** | SSO 버튼 + 일반 폼 | 둘 다 제공 |

---

## 🎯 권장 방식

### 표준 SSO 패턴 (옵션 1)

```
SSO 활성화 시:
  → SSO 로그인만 제공
  → 일반 로그인 숨김
```

**이유:**
- 일관성 유지
- 사용자 혼란 방지
- SSO 목적에 부합

---

### 하이브리드 (옵션 2)

```
SSO 활성화 시:
  → SSO 로그인 + 일반 로그인 둘 다 제공
```

**이유:**
- 기존 사용자 지원 (일반 회원가입한 사용자)
- 유연성

---

## 🔄 실제 동작

### 시나리오 A: SSO 비활성화

```
프론트엔드:
  GET /api/sso/status
  → { enabled: false }
  
UI 표시:
  [이메일 입력]
  [비밀번호 입력]
  [로그인 버튼]
  
사용자: 폼 입력 → POST /api/auth/login ✅
```

---

### 시나리오 B: SSO 활성화 (옵션 1)

```
프론트엔드:
  GET /api/sso/status
  → { enabled: true }
  
UI 표시:
  [SSO로 로그인] 버튼만
  
사용자: 버튼 클릭 → GET /api/sso/login ✅
```

---

### 시나리오 C: SSO 활성화 (옵션 2)

```
프론트엔드:
  GET /api/sso/status
  → { enabled: true }
  
UI 표시:
  [SSO로 로그인] 버튼
  또는
  [일반 로그인 폼]
  
사용자 선택:
  - SSO 버튼 → GET /api/sso/login ✅
  - 일반 폼 → POST /api/auth/login ⚠️ (SSO 사용자는 실패)
```

---

## 📝 결론

**질문: UI가 2개 필요한가?**

**답변:**
- **옵션 1 (권장)**: SSO 상태에 따라 1개씩만 표시
  - SSO 비활성화: 일반 로그인 UI
  - SSO 활성화: SSO 로그인 UI
  
- **옵션 2**: SSO 활성화 시 둘 다 제공
  - SSO 버튼 + 일반 로그인 폼

**프론트엔드에서 `/api/sso/status`로 SSO 상태 확인 후 조건부 렌더링하면 됩니다!**

