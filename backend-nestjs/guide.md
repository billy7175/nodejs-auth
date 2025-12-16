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
# PostgreSQL Docker 컨테이너 시작
docker-compose up -d

# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

## PostgreSQL 데이터베이스 설정

### Docker Compose로 PostgreSQL 실행

```bash
# PostgreSQL 컨테이너 시작
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps

# 컨테이너 중지
docker-compose down

# 컨테이너 중지 및 볼륨 삭제 (데이터 초기화)
docker-compose down -v
```

### DBeaver 연결 설정

1. DBeaver 실행 → 새 연결 생성
2. PostgreSQL 선택
3. 연결 정보 입력:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `nestjs_db` ⚠️ **중요: 기본값 `postgres`가 아닌 `nestjs_db`로 설정**
   - **Username**: `postgres`
   - **Password**: `postgres`
4. 테스트 연결 → 완료

**주의사항:**
- Database 이름을 반드시 `nestjs_db`로 설정해야 합니다
- 기본값인 `postgres`로 연결하면 `users` 테이블을 찾을 수 없습니다

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nestjs_db
```

### 데이터베이스 연결 확인

애플리케이션 실행 시 콘솔에 다음 메시지가 표시되면 연결 성공:
- `✅ PostgreSQL 연결 성공`
- `✅ users 테이블 생성 완료`
- `✅ 샘플 데이터 삽입 완료 (3건)`

### DBeaver에서 확인할 테이블 구조

**users 테이블:**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY | 자동 생성 UUID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 (고유값) |
| password | VARCHAR(255) | NOT NULL | 비밀번호 (해시) |
| name | VARCHAR(100) | NULL | 이름 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**샘플 데이터 (자동 삽입):**

| id | email | password | name | created_at | updated_at |
|----|-------|----------|------|------------|------------|
| UUID | user1@example.com | hashed_password_1 | 홍길동 | 2024-... | 2024-... |
| UUID | user2@example.com | hashed_password_2 | 김철수 | 2024-... | 2024-... |
| UUID | user3@example.com | hashed_password_3 | 이영희 | 2024-... | 2024-... |

**DBeaver에서 확인 방법:**
1. 연결 후 `nestjs_db` 데이터베이스 선택
2. `Schemas` → `public` → `Tables` → `users` 테이블 확인
3. `users` 테이블 우클릭 → `View Data` 클릭하여 데이터 확인

## API 엔드포인트

### GET /test
테스트 API

**Response:**
```json
{
  "message": "Test API is working"
}
```

