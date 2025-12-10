# 🔒 Content Security Policy (CSP) 비활성화 이유

## 📋 현재 설정

```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // 인라인 스크립트 허용을 위해 CSP 비활성화
}));
```

---

## 🔍 비활성화한 이유

### 문제 상황

프론트엔드 테스트 페이지(`backend/public/*.html`)에서:

1. **인라인 스크립트 사용**
   ```html
   <script>
       alert('HTML이 로드되었습니다!');
   </script>
   ```

2. **onclick 속성 사용**
   ```html
   <button onclick="showTab('register', this)">회원가입</button>
   <button onclick="start2FASetup()">2FA 설정 시작</button>
   ```

3. **인라인 스타일 사용**
   ```html
   <style>
       * { margin: 0; padding: 0; }
   </style>
   ```

### Helmet의 기본 CSP 동작

Helmet의 기본 CSP는:
- ❌ 인라인 `<script>` 태그 차단
- ❌ `onclick` 같은 인라인 이벤트 핸들러 차단
- ❌ 인라인 `<style>` 태그 차단

**결과:**
- JavaScript가 실행되지 않음
- 버튼 클릭이 작동하지 않음
- 콘솔에 CSP 위반 에러 발생

---

## ⚠️ 보안 문제

### 현재 상태 (CSP 비활성화)

**장점:**
- ✅ 테스트 페이지가 정상 작동
- ✅ 인라인 스크립트 사용 가능

**단점:**
- ❌ XSS 공격에 취약
- ❌ 인라인 스크립트 주입 공격 가능
- ❌ 보안 헤더 없음

---

## ✅ 개선 방법

### 방법 1: CSP 적절히 설정 (권장)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // 인라인 스크립트 허용
      styleSrc: ["'self'", "'unsafe-inline'"],  // 인라인 스타일 허용
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));
```

**주의:** `'unsafe-inline'`은 보안상 좋지 않지만, 테스트 페이지를 위해 필요

### 방법 2: 외부 JS 파일로 분리 (더 안전)

```html
<!-- ❌ 현재 (인라인) -->
<script>
  function showTab() { ... }
</script>

<!-- ✅ 개선 (외부 파일) -->
<script src="/js/main.js"></script>
```

그리고 CSP 설정:
```javascript
contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'"],  // 'unsafe-inline' 불필요
    styleSrc: ["'self'"],
  },
}
```

### 방법 3: 개발 환경에서만 비활성화

```javascript
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' 
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
        },
      }
    : false,  // 개발 환경에서는 비활성화
}));
```

---

## 📊 비교

| 방법 | 보안 | 편의성 | 권장 |
|------|------|--------|------|
| **CSP 완전 비활성화** | ❌ 낮음 | ✅ 높음 | ❌ 비권장 |
| **CSP + unsafe-inline** | ⚠️ 중간 | ✅ 높음 | ⚠️ 테스트용 |
| **외부 JS 파일 분리** | ✅ 높음 | ⚠️ 중간 | ✅ 권장 |
| **개발/프로덕션 분리** | ✅ 높음 | ✅ 높음 | ✅ 권장 |

---

## 🎯 현재 상황

### 근본 원인

**React/Vue를 사용하지 않고, 순수 HTML + 인라인 스크립트를 사용하고 있어서 CSP를 false로 설정했습니다.**

#### 현재 구조 (순수 HTML)
```javascript
// app.js
app.use(express.static(path.join(__dirname, '../public')));
// → Node.js에서 정적 HTML 파일을 직접 서빙
```

```html
<!-- index.html -->
<script>
  // ❌ 인라인 스크립트
  alert('HTML이 로드되었습니다!');
</script>
<button onclick="showTab()">클릭</button>  <!-- ❌ 인라인 이벤트 -->
```

**문제:**
- 인라인 스크립트 사용 → Helmet CSP가 차단
- CSP를 false로 설정해야 동작

---

#### React/Vue를 사용하는 경우

**React/Vue는 빌드 시 자동으로 외부 JS 파일로 분리됩니다:**

```html
<!-- ✅ React/Vue 빌드 후 (CSP 문제 없음) -->
<script src="/static/js/main.abc123.js"></script>
```

**결과:**
- ✅ 인라인 스크립트 없음
- ✅ CSP를 false로 설정할 필요 없음
- ✅ CSP를 활성화해도 정상 작동

---

### 비교

| 방식 | 인라인 스크립트 | CSP 설정 | 이유 |
|------|----------------|----------|------|
| **현재 (순수 HTML)** | ✅ 사용 | ❌ `false` 필요 | 인라인 스크립트 차단 방지 |
| **React/Vue** | ❌ 없음 | ✅ 활성화 가능 | 빌드 시 외부 파일로 분리 |

---

### 2FA 브랜치의 목적

- **테스트 페이지**: 간단한 HTML로 빠른 테스트
- **프로덕션 아님**: 실제 서비스가 아닌 개발/테스트용
- **인라인 스크립트 사용**: 빠른 개발을 위해 인라인으로 작성

### 결론

**정확한 이유:**
- ✅ **React/Vue를 사용하지 않고 순수 HTML을 사용** → 인라인 스크립트 필요
- ✅ **인라인 스크립트 사용** → Helmet CSP가 차단
- ✅ **CSP를 false로 설정** → 인라인 스크립트 허용

**React/Vue를 사용하면:**
- 빌드 시 외부 JS 파일로 자동 분리
- CSP를 false로 설정할 필요 없음
- CSP를 활성화해도 정상 작동

**현재 설정이 적절합니다:**
- 테스트 목적이므로 CSP 비활성화 허용
- 프로덕션 배포 시에는 React/Vue 사용 또는 외부 JS 파일로 분리 후 CSP 활성화

---

## 📝 권장 사항

### 현재 (테스트 환경)
```javascript
contentSecurityPolicy: false  // ✅ 테스트용으로 OK
```

### 프로덕션 배포 시
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],  // 외부 JS 파일만 허용
    styleSrc: ["'self'"],
  },
}
```

그리고 HTML을 외부 JS 파일로 리팩토링:
```
backend/public/
├── index.html
├── js/
│   └── main.js  # 인라인 스크립트를 여기로 이동
└── css/
    └── style.css  # 인라인 스타일을 여기로 이동
```

---

**작성일**: 2025년 12월 10일

