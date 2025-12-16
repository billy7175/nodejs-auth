# NestJS Backend Guide

## 프로젝트 구조

```
backend-nestjs/
├── src/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
└── package.json
```

## 실행 방법

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

## API 엔드포인트

### GET /test
테스트 API

**Response:**
```json
{
  "message": "Test API is working"
}
```

