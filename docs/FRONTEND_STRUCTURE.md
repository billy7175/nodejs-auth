# 📁 프론트엔드 구조 설명

## 현재 구조: `backend/public/`

### 왜 `frontend/` 폴더가 아닌가?

**현재는 단순 HTML 파일이므로 `backend/public/`이 적합합니다:**

```
nodejs-auth/
├── backend/
│   ├── public/              # ✅ 정적 HTML 파일 (현재)
│   │   ├── index.html
│   │   ├── 2fa-setup.html
│   │   └── passkey.html
│   └── src/
│       └── app.js           # express.static('public')
```

**장점:**
- ✅ **빌드 과정 불필요** - HTML 파일을 바로 서빙
- ✅ **설정 간단** - Express의 `express.static()`만 사용
- ✅ **빠른 개발** - 수정 후 바로 반영
- ✅ **프레임워크 불필요** - 순수 HTML + JavaScript

---

## React/Vue를 사용할 경우: `frontend/` 폴더

### 언제 `frontend/` 폴더가 필요한가?

**React, Vue, Angular 같은 프레임워크를 사용할 때:**

```
nodejs-auth/
├── backend/                 # Node.js API 서버
│   └── src/
│       └── app.js
├── frontend/                # ✅ React/Vue 앱 (별도 폴더)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js       # 또는 webpack.config.js
└── docs/
```

**필요한 이유:**
- ⚠️ **빌드 과정 필요** - JSX/TSX → JavaScript 변환
- ⚠️ **별도 package.json** - React/Vue 의존성 관리
- ⚠️ **개발 서버 분리** - Vite/Webpack Dev Server
- ⚠️ **프로덕션 빌드** - `npm run build` → `dist/` 폴더 생성

---

## 구조 비교

### 현재 구조 (단순 HTML)

```
backend/
├── public/              # 정적 파일
│   └── index.html
└── src/
    └── app.js           # express.static('public')
```

**서빙 방식:**
```javascript
// app.js
app.use(express.static('public'));
// → http://localhost:4000/index.html
```

**장점:**
- ✅ 즉시 사용 가능
- ✅ 빌드 과정 없음
- ✅ 설정 최소화

---

### React/Vue 구조 (프레임워크 사용)

```
nodejs-auth/
├── backend/
│   └── src/
│       └── app.js
└── frontend/            # 별도 폴더
    ├── src/
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

**개발 환경:**
```bash
# 터미널 1: 백엔드
cd backend
npm start              # http://localhost:4000

# 터미널 2: 프론트엔드
cd frontend
npm run dev            # http://localhost:5173 (Vite)
```

**프로덕션 빌드:**
```bash
# 1. 프론트엔드 빌드
cd frontend
npm run build           # → dist/ 폴더 생성

# 2. 백엔드에서 서빙
# app.js
app.use(express.static('../frontend/dist'));
```

---

## 현재 구조가 적합한 이유

### 1. 단순한 테스트 페이지
- React/Vue 같은 복잡한 프레임워크 불필요
- 순수 HTML + JavaScript로 충분

### 2. 빠른 개발
- 수정 후 바로 반영 (빌드 불필요)
- 별도 개발 서버 불필요

### 3. 백엔드 중심 프로젝트
- API 테스트가 주 목적
- 프론트엔드는 보조적 역할

---

## 향후 확장 시나리오

### 시나리오 1: React 추가하기

**1단계: frontend 폴더 생성**
```bash
npx create-react-app frontend
# 또는
npm create vite@latest frontend -- --template react
```

**2단계: 프로젝트 구조**
```
nodejs-auth/
├── backend/
│   └── src/
│       └── app.js
└── frontend/           # 새로 생성
    ├── src/
    │   └── App.jsx
    └── package.json
```

**3단계: 개발 환경**
```bash
# 백엔드 (포트 4000)
cd backend && npm start

# 프론트엔드 (포트 5173)
cd frontend && npm run dev
```

**4단계: 프로덕션 빌드**
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드에서 서빙
# app.js 수정
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

---

### 시나리오 2: 현재 구조 유지

**현재 `backend/public/` 구조를 계속 사용:**
- 단순한 테스트 페이지로 충분
- React/Vue 추가 계획 없음
- 빠른 프로토타이핑

---

## 권장 사항

### 현재 단계
✅ **`backend/public/` 구조 유지**
- 테스트 목적이므로 충분
- 복잡한 설정 불필요
- 빠른 개발 가능

### 향후 확장 시
⚠️ **`frontend/` 폴더 추가 고려**
- React/Vue 같은 프레임워크 필요 시
- 복잡한 UI/UX 요구사항
- 상태 관리, 라우팅 등 필요

---

## 결론

| 상황 | 구조 | 이유 |
|------|------|------|
| **현재 (단순 HTML)** | `backend/public/` | ✅ 빌드 불필요, 설정 간단 |
| **React/Vue 사용** | `frontend/` | ⚠️ 빌드 필요, 별도 관리 |

**현재는 `backend/public/` 구조가 가장 적합합니다!** 🎯

나중에 React/Vue를 추가할 때만 `frontend/` 폴더를 만들면 됩니다.

