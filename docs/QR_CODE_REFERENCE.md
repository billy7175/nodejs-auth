# 📱 QR 코드 데이터 구조 및 스캔 과정

## 🔍 QR 코드 생성 시 포함되는 데이터

### 1. otpauth URL 형식

```
otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm={algorithm}&digits={digits}&period={period}
```

### 2. 실제 예시

```
otpauth://totp/MyApp%20(user%40example.com)?secret=PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ&algorithm=SHA1&digits=6&period=30
```

### 3. 포함되는 데이터 상세

| 파라미터 | 값 | 설명 |
|---------|-----|------|
| **Protocol** | `otpauth://` | OTP 인증 프로토콜 |
| **Type** | `totp` | TOTP (Time-based OTP) |
| **Label** | `MyApp (user@example.com)` | 표시용 라벨 (URL 인코딩됨) |
| **Secret** | `PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ` | Base32 인코딩된 비밀 키 |
| **Issuer** | `MyApp` | 발행자 (표시용) |
| **Algorithm** | `SHA1` | 해시 알고리즘 |
| **Digits** | `6` | 생성되는 코드 자릿수 |
| **Period** | `30` | 코드 갱신 주기 (초) |

---

## 📊 데이터 구조

### URL 파싱 결과

```
Protocol: otpauth://
Type: totp
Label: MyApp (user@example.com)
Query Parameters:
  secret: PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ
  algorithm: SHA1
  digits: 6
  period: 30
```

### QR 코드로 변환

```
otpauth URL (텍스트)
  ↓
QR 코드 라이브러리 (qrcode)
  ↓
QR 코드 이미지 (PNG/Base64)
```

---

## 📱 QR 스캔 시 발생하는 일 (데이터 관점)

### 1. 스캔 과정

```
QR 코드 이미지
  ↓
Google Authenticator 스캔
  ↓
otpauth URL 추출 (텍스트)
  ↓
URL 파싱
  ↓
데이터 저장
```

### 2. Google Authenticator가 하는 일

#### Step 1: URL 파싱

```javascript
// 스캔된 URL
const url = "otpauth://totp/MyApp%20(user%40example.com)?secret=PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ&algorithm=SHA1&digits=6&period=30";

// 파싱
const parsed = {
  protocol: "otpauth://",
  type: "totp",
  label: "MyApp (user@example.com)",
  secret: "PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ",
  algorithm: "SHA1",
  digits: 6,
  period: 30
};
```

#### Step 2: 데이터 저장

```javascript
// Google Authenticator 내부 저장 (예시)
{
  accountName: "MyApp (user@example.com)",  // Label에서 추출
  issuer: "MyApp",                          // Issuer 또는 Label에서 추출
  secret: "PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ",  // Secret 저장
  algorithm: "SHA1",                        // 알고리즘 저장
  digits: 6,                                // 자릿수 저장
  period: 30,                                // 주기 저장
  createdAt: "2024-12-10T01:00:00Z"        // 등록 시간
}
```

#### Step 3: TOTP 코드 생성

```javascript
// Google Authenticator가 매 30초마다 실행
const currentTime = Math.floor(Date.now() / 1000);
const timeCounter = Math.floor(currentTime / 30);  // period=30

// HMAC-SHA1 계산
const hmac = crypto.createHmac('sha1', secret);
hmac.update(Buffer.from(timeCounter.toString(16), 'hex'));
const hash = hmac.digest();

// 6자리 코드 생성
const offset = hash[hash.length - 1] & 0x0f;
const code = ((hash[offset] & 0x7f) << 24 |
              (hash[offset + 1] & 0xff) << 16 |
              (hash[offset + 2] & 0xff) << 8 |
              (hash[offset + 3] & 0xff)) % 1000000;

// 6자리로 포맷팅
const formattedCode = code.toString().padStart(6, '0');
// 예: "123456"
```

---

## 🔄 전체 데이터 흐름

### 서버 → QR 코드

```
1. Secret 생성
   secret.base32 = "PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ"

2. otpauth URL 생성
   otpauth://totp/MyApp%20(user%40example.com)?secret=PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ&algorithm=SHA1&digits=6&period=30

3. QR 코드 생성
   QRCode.toDataURL(otpauthUrl)
   → Base64 이미지 데이터

4. 클라이언트에 전송
   {
     "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
   }
```

### QR 코드 → Google Authenticator

```
1. QR 코드 스캔
   → otpauth URL 추출

2. URL 파싱
   → secret, algorithm, digits, period 추출

3. 데이터 저장
   → Google Authenticator 앱 내부 저장소에 저장

4. 계정 표시
   → "MyApp (user@example.com)" 표시
```

### Google Authenticator → TOTP 코드

```
1. 현재 시간 확인
   currentTime = 1702195200 (Unix timestamp)

2. Time counter 계산
   timeCounter = Math.floor(1702195200 / 30) = 56739840

3. HMAC-SHA1 계산
   hmac = HMAC-SHA1(secret, timeCounter)
   hash = hmac.digest()

4. 6자리 코드 생성
   code = extractDigits(hash) % 1000000
   → "123456"

5. 화면에 표시
   → 사용자가 볼 수 있도록 표시
```

### 사용자 → 서버 검증

```
1. 사용자가 코드 입력
   code = "123456"

2. 서버에서 동일한 계산
   secret = "PNITEOS2K4SW4IKQHRDUSUS2EM2EMZK2HBTGCN3EOZFTQVZVK4ZQ"
   currentTime = 1702195200
   timeCounter = 56739840
   hmac = HMAC-SHA1(secret, timeCounter)
   expectedCode = "123456"

3. 비교
   inputCode === expectedCode
   → true ✅
```

---

## 📋 데이터 요약

### QR 코드에 포함되는 데이터

1. **Secret (비밀 키)**
   - Base32 인코딩된 32바이트 랜덤 문자열
   - TOTP 코드 생성의 핵심

2. **Label (라벨)**
   - 표시용 이름
   - 예: "MyApp (user@example.com)"

3. **Issuer (발행자)**
   - 서비스 이름
   - 예: "MyApp"

4. **Algorithm (알고리즘)**
   - 해시 알고리즘
   - 기본값: SHA1

5. **Digits (자릿수)**
   - 생성되는 코드 자릿수
   - 기본값: 6

6. **Period (주기)**
   - 코드 갱신 주기 (초)
   - 기본값: 30

### Google Authenticator가 저장하는 데이터

1. **Secret** (가장 중요)
   - TOTP 코드 생성에 사용

2. **Algorithm, Digits, Period**
   - 코드 생성 규칙

3. **Label, Issuer**
   - 표시용 정보

---

## 🔐 보안 고려사항

### Secret의 중요성

- **Secret은 절대 노출되면 안 됨**
- QR 코드는 일회성으로만 사용 (스캔 후 삭제 권장)
- Secret이 노출되면 해당 계정의 2FA가 무력화됨

### 데이터 전송

- QR 코드는 HTTPS 환경에서만 사용
- Secret이 평문으로 포함되어 있음
- 스캔 후 즉시 화면에서 제거 권장

---

**작성자:** AI Assistant  
**날짜:** 2025년 12월 10일

