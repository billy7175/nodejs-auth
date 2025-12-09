# 🚀 고급 인증 시스템 (Advanced Authentication)

> 기본 JWT 인증을 넘어서는 고도화된 인증 방식들

---

## 📑 목차

1. [OTP (One-Time Password)](#1-otp-one-time-password)
2. [Passkey (WebAuthn/FIDO2)](#2-passkey-webauthfido2)
3. [2단계 인증 (2FA/MFA)](#3-2단계-인증-2famfa)
4. [소셜 로그인 (OAuth 2.0)](#4-소셜-로그인-oauth-20)
5. [매직 링크 (Passwordless)](#5-매직-링크-passwordless)
6. [SMS/이메일 인증](#6-sms이메일-인증)
7. [SSO (Single Sign-On)](#7-sso-single-sign-on)
8. [세션 관리 고도화](#8-세션-관리-고도화)
9. [기기 관리 및 신뢰할 수 있는 기기](#9-기기-관리-및-신뢰할-수-있는-기기)

---

## 1. OTP (One-Time Password)

### 개요
일회용 비밀번호로, 시간 또는 카운터 기반으로 생성되는 6자리 코드입니다.

### 종류

| 유형 | 설명 | 사용 사례 |
|------|------|----------|
| **TOTP** | Time-based OTP (시간 기반) | Google Authenticator, Authy |
| **HOTP** | HMAC-based OTP (카운터 기반) | 하드웨어 토큰 |

### TOTP 구현

```javascript
// 라이브러리: speakeasy, otplib
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// 1. 비밀 키 생성 (사용자 등록 시)
const secret = speakeasy.generateSecret({
  name: 'MyApp (user@example.com)',
  issuer: 'MyApp'
});

// secret.base32 → DB에 저장
// secret.otpauth_url → QR 코드 생성용

// 2. QR 코드 생성
const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

// 3. OTP 검증
const isValid = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: userInputCode,
  window: 1  // 전후 30초 허용
});
```

### API 설계

```
POST /api/auth/2fa/setup
→ QR 코드 URL + 백업 코드 반환

POST /api/auth/2fa/verify
→ OTP 코드 검증 및 2FA 활성화

POST /api/auth/2fa/disable
→ 2FA 비활성화

POST /api/auth/login/2fa
→ 2FA가 활성화된 계정 로그인 시 OTP 검증
```

### TOTP 플로우

```
┌────────────────────────────────────────────────────────────────┐
│                      TOTP 설정 플로우                           │
├────────────────────────────────────────────────────────────────┤
│  1. 사용자: 2FA 설정 요청                                       │
│  2. 서버: 32바이트 비밀 키 생성                                 │
│  3. 서버: otpauth:// URL 생성                                   │
│  4. 서버 → 클라이언트: QR 코드 + 백업 코드                      │
│  5. 사용자: Authenticator 앱으로 QR 스캔                        │
│  6. 사용자: 생성된 6자리 코드 입력                              │
│  7. 서버: 코드 검증 후 2FA 활성화                               │
└────────────────────────────────────────────────────────────────┘
```

### 백업 코드

```javascript
// 10개의 일회용 백업 코드 생성
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes; // ['A1B2C3D4', 'E5F6G7H8', ...]
};

// 백업 코드는 해싱하여 저장
const hashedCodes = await Promise.all(
  codes.map(code => bcrypt.hash(code, 10))
);
```

---

## 2. Passkey (WebAuthn/FIDO2)

### 개요
비밀번호 없이 생체인식(지문, 얼굴), 보안 키, 또는 기기 PIN으로 인증하는 최신 표준입니다.

### 특징

| 장점 | 설명 |
|------|------|
| **피싱 방지** | 도메인에 바인딩되어 피싱 사이트에서 사용 불가 |
| **비밀번호 불필요** | 분실/유출 위험 없음 |
| **편리함** | 생체인식으로 빠른 로그인 |
| **크로스 디바이스** | iCloud, Google 계정으로 동기화 가능 |

### 구현 라이브러리

```bash
npm install @simplewebauthn/server @simplewebauthn/browser
```

### 등록 (Registration) 플로우

```javascript
// 서버: 등록 옵션 생성
const { generateRegistrationOptions, verifyRegistrationResponse } 
  = require('@simplewebauthn/server');

// 1. 등록 옵션 생성
const options = await generateRegistrationOptions({
  rpName: 'My Application',
  rpID: 'example.com',
  userID: user.id,
  userName: user.email,
  userDisplayName: user.name,
  attestationType: 'none',
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'preferred',
    authenticatorAttachment: 'platform', // 또는 'cross-platform'
  },
});

// 2. 클라이언트에서 credential 생성 후 서버로 전송

// 3. 등록 응답 검증
const verification = await verifyRegistrationResponse({
  response: clientResponse,
  expectedChallenge: savedChallenge,
  expectedOrigin: 'https://example.com',
  expectedRPID: 'example.com',
});

// 4. credential 정보 저장
if (verification.verified) {
  const { credentialID, credentialPublicKey, counter } 
    = verification.registrationInfo;
  
  await saveCredential({
    oderId: user.id,
    credentialID: Buffer.from(credentialID),
    publicKey: Buffer.from(credentialPublicKey),
    counter,
  });
}
```

### 인증 (Authentication) 플로우

```javascript
const { generateAuthenticationOptions, verifyAuthenticationResponse } 
  = require('@simplewebauthn/server');

// 1. 인증 옵션 생성
const options = await generateAuthenticationOptions({
  rpID: 'example.com',
  allowCredentials: userCredentials.map(cred => ({
    id: cred.credentialID,
    type: 'public-key',
  })),
  userVerification: 'preferred',
});

// 2. 클라이언트에서 assertion 생성 후 서버로 전송

// 3. 인증 응답 검증
const verification = await verifyAuthenticationResponse({
  response: clientResponse,
  expectedChallenge: savedChallenge,
  expectedOrigin: 'https://example.com',
  expectedRPID: 'example.com',
  authenticator: {
    credentialID: credential.credentialID,
    credentialPublicKey: credential.publicKey,
    counter: credential.counter,
  },
});

// 4. counter 업데이트 (재사용 공격 방지)
if (verification.verified) {
  await updateCredentialCounter(
    credential.id, 
    verification.authenticationInfo.newCounter
  );
}
```

### API 설계

```
POST /api/auth/passkey/register/options
→ 등록 옵션 반환

POST /api/auth/passkey/register/verify
→ 등록 완료

POST /api/auth/passkey/login/options
→ 인증 옵션 반환

POST /api/auth/passkey/login/verify
→ 로그인 완료
```

### Passkey 데이터 모델

```javascript
const passkeySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  credentialID: { type: Buffer, required: true, unique: true },
  publicKey: { type: Buffer, required: true },
  counter: { type: Number, default: 0 },
  deviceType: { type: String }, // 'singleDevice' | 'multiDevice'
  backedUp: { type: Boolean, default: false },
  transports: [{ type: String }], // ['internal', 'usb', 'ble', 'nfc']
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
  friendlyName: { type: String }, // "iPhone 15", "MacBook Pro"
});
```

---

## 3. 2단계 인증 (2FA/MFA)

### 인증 요소 분류

| 요소 | 설명 | 예시 |
|------|------|------|
| **지식 (Something you know)** | 알고 있는 정보 | 비밀번호, PIN |
| **소유 (Something you have)** | 가지고 있는 것 | 휴대폰, 보안 키 |
| **존재 (Something you are)** | 생체 정보 | 지문, 얼굴, 홍채 |
| **위치 (Somewhere you are)** | 물리적 위치 | IP, GPS |

### MFA 구현 전략

```javascript
const mfaSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  methods: [{
    type: { 
      type: String, 
      enum: ['totp', 'sms', 'email', 'passkey', 'backup_code'] 
    },
    enabled: Boolean,
    primary: Boolean,  // 기본 2FA 방식
    data: Schema.Types.Mixed,  // 방식별 추가 데이터
    lastUsed: Date,
  }],
  backupCodes: [{
    codeHash: String,
    used: Boolean,
    usedAt: Date,
  }],
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    lastSeen: Date,
    expiresAt: Date,
  }],
});
```

### 적응형 MFA (Adaptive MFA)

리스크 기반으로 MFA를 동적으로 요구합니다.

```javascript
const calculateRiskScore = async (loginAttempt) => {
  let riskScore = 0;
  
  // 새로운 기기
  if (!await isKnownDevice(loginAttempt.deviceId)) {
    riskScore += 30;
  }
  
  // 새로운 IP/위치
  if (!await isKnownLocation(loginAttempt.ip)) {
    riskScore += 25;
  }
  
  // 비정상적인 시간대
  if (isUnusualTime(loginAttempt.timestamp, user.timezone)) {
    riskScore += 15;
  }
  
  // 불가능한 이동 (Impossible Travel)
  if (await hasImpossibleTravel(user.id, loginAttempt)) {
    riskScore += 40;
  }
  
  // 최근 비밀번호 변경 시도 실패
  if (await hasRecentFailedAttempts(user.id)) {
    riskScore += 20;
  }
  
  return riskScore;
};

// 리스크 점수에 따른 액션
const getRequiredAuth = (riskScore) => {
  if (riskScore < 20) return ['password'];
  if (riskScore < 50) return ['password', '2fa'];
  if (riskScore < 80) return ['password', '2fa', 'email_verify'];
  return ['blocked']; // 관리자 확인 필요
};
```

---

## 4. 소셜 로그인 (OAuth 2.0)

### 지원 가능한 Provider

| Provider | 라이브러리 |
|----------|-----------|
| Google | passport-google-oauth20 |
| Apple | passport-apple |
| Kakao | passport-kakao |
| Naver | passport-naver-v2 |
| GitHub | passport-github2 |
| Facebook | passport-facebook |

### Passport.js 구현

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 기존 사용자 찾기 또는 새로 생성
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          emailVerified: true,
        });
      } else if (!user.googleId) {
        // 기존 이메일 계정에 Google 연동
        user.googleId = profile.id;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));
```

### API 엔드포인트

```
GET /api/auth/google
→ Google 로그인 페이지로 리다이렉트

GET /api/auth/google/callback
→ Google에서 콜백, JWT 발급

POST /api/auth/google/token
→ 클라이언트에서 받은 ID Token으로 서버 인증 (모바일앱용)

DELETE /api/auth/providers/google
→ Google 계정 연동 해제
```

### 계정 연동 모델

```javascript
const userSchema = new Schema({
  email: String,
  password: String,  // 소셜 로그인만 사용 시 null
  
  // 소셜 계정 연동
  providers: {
    google: {
      id: String,
      email: String,
      linkedAt: Date,
    },
    kakao: {
      id: String,
      email: String,
      linkedAt: Date,
    },
    apple: {
      id: String,
      email: String,
      linkedAt: Date,
    },
  },
  
  primaryAuthMethod: {
    type: String,
    enum: ['password', 'google', 'kakao', 'apple', 'passkey'],
  },
});
```

---

## 5. 매직 링크 (Passwordless)

### 개요
비밀번호 대신 이메일로 전송된 일회용 링크로 로그인합니다.

### 구현

```javascript
const crypto = require('crypto');

// 1. 매직 링크 생성
const generateMagicLink = async (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15분
  
  await MagicLink.create({
    email,
    token: await bcrypt.hash(token, 10),
    expiresAt,
  });
  
  const magicLink = `${process.env.APP_URL}/auth/magic/${token}?email=${encodeURIComponent(email)}`;
  
  await sendEmail({
    to: email,
    subject: '로그인 링크',
    html: `
      <p>아래 버튼을 클릭하여 로그인하세요.</p>
      <a href="${magicLink}" style="...">로그인하기</a>
      <p>이 링크는 15분 후 만료됩니다.</p>
    `,
  });
  
  return { success: true };
};

// 2. 매직 링크 검증
const verifyMagicLink = async (email, token) => {
  const magicLink = await MagicLink.findOne({
    email,
    expiresAt: { $gt: new Date() },
    used: false,
  });
  
  if (!magicLink) {
    throw new Error('유효하지 않거나 만료된 링크입니다.');
  }
  
  const isValid = await bcrypt.compare(token, magicLink.token);
  if (!isValid) {
    throw new Error('유효하지 않은 링크입니다.');
  }
  
  // 링크 사용 처리
  magicLink.used = true;
  await magicLink.save();
  
  // 사용자 찾기 또는 생성
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, emailVerified: true });
  }
  
  // JWT 발급
  return generateTokens(user);
};
```

### API 설계

```
POST /api/auth/magic-link/send
Body: { "email": "user@example.com" }
→ 매직 링크 이메일 발송

GET /api/auth/magic-link/verify?token=xxx&email=xxx
→ 링크 검증 및 로그인
```

---

## 6. SMS/이메일 인증

### SMS OTP (Twilio 사용)

```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP 발송
const sendSmsOtp = async (phoneNumber) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분
  
  await SmsVerification.create({
    phoneNumber,
    otp: await bcrypt.hash(otp, 10),
    expiresAt,
    attempts: 0,
  });
  
  await client.messages.create({
    body: `[MyApp] 인증번호: ${otp} (5분 내 입력)`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
  
  return { success: true };
};

// OTP 검증
const verifySmsOtp = async (phoneNumber, inputOtp) => {
  const verification = await SmsVerification.findOne({
    phoneNumber,
    expiresAt: { $gt: new Date() },
    verified: false,
  });
  
  if (!verification) {
    throw new Error('인증 요청을 찾을 수 없습니다.');
  }
  
  // 시도 횟수 제한
  if (verification.attempts >= 5) {
    throw new Error('최대 시도 횟수를 초과했습니다.');
  }
  
  verification.attempts += 1;
  
  const isValid = await bcrypt.compare(inputOtp, verification.otp);
  if (!isValid) {
    await verification.save();
    throw new Error('잘못된 인증번호입니다.');
  }
  
  verification.verified = true;
  await verification.save();
  
  return { success: true };
};
```

### 이메일 인증 코드

```javascript
const sendEmailVerification = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await EmailVerification.create({
    email,
    code: await bcrypt.hash(code, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  
  await sendEmail({
    to: email,
    subject: '이메일 인증 코드',
    html: `
      <h2>인증 코드: <strong>${code}</strong></h2>
      <p>10분 내에 입력해주세요.</p>
    `,
  });
};
```

---

## 7. SSO (Single Sign-On)

### SAML 2.0 구현

```javascript
const saml2 = require('saml2-js');

// Service Provider (SP) 설정
const spOptions = {
  entity_id: 'https://myapp.com/metadata',
  private_key: fs.readFileSync('sp-key.pem').toString(),
  certificate: fs.readFileSync('sp-cert.pem').toString(),
  assert_endpoint: 'https://myapp.com/api/auth/saml/callback',
};
const sp = new saml2.ServiceProvider(spOptions);

// Identity Provider (IdP) 설정
const idpOptions = {
  sso_login_url: 'https://idp.company.com/sso',
  sso_logout_url: 'https://idp.company.com/logout',
  certificates: [idpCertificate],
};
const idp = new saml2.IdentityProvider(idpOptions);

// 로그인 요청
app.get('/api/auth/saml/login', (req, res) => {
  sp.create_login_request_url(idp, {}, (err, loginUrl) => {
    if (err) return res.status(500).send('Error');
    res.redirect(loginUrl);
  });
});

// SAML 응답 처리
app.post('/api/auth/saml/callback', (req, res) => {
  sp.post_assert(idp, { request_body: req.body }, async (err, response) => {
    if (err) return res.status(401).send('Auth failed');
    
    const { name_id, attributes } = response.user;
    
    // 사용자 찾기/생성 및 JWT 발급
    const user = await findOrCreateSsoUser({
      email: name_id,
      name: attributes.displayName,
      ssoProvider: 'company-saml',
    });
    
    const tokens = generateTokens(user);
    res.redirect(`/auth/callback?token=${tokens.accessToken}`);
  });
});
```

### OpenID Connect (OIDC)

```javascript
const { Issuer, Strategy } = require('openid-client');

// OIDC Provider 설정
const setupOIDC = async () => {
  const issuer = await Issuer.discover('https://idp.company.com');
  
  const client = new issuer.Client({
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uris: ['https://myapp.com/api/auth/oidc/callback'],
    response_types: ['code'],
  });
  
  passport.use('oidc', new Strategy({ client }, (tokenSet, userinfo, done) => {
    // 사용자 처리
    return done(null, userinfo);
  }));
};
```

---

## 8. 세션 관리 고도화

### 활성 세션 관리

```javascript
const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true },
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    device: String,
  },
  ipAddress: String,
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
});

// 인덱스
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### API 엔드포인트

```
GET /api/auth/sessions
→ 모든 활성 세션 목록

DELETE /api/auth/sessions/:sessionId
→ 특정 세션 종료

DELETE /api/auth/sessions
→ 현재 세션 제외 모든 세션 종료 (모든 기기에서 로그아웃)
```

### 세션 목록 응답 예시

```json
{
  "success": true,
  "data": {
    "currentSessionId": "session_123",
    "sessions": [
      {
        "id": "session_123",
        "device": "Chrome on macOS",
        "location": "Seoul, South Korea",
        "ipAddress": "123.456.xxx.xxx",
        "lastActivity": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-10T09:00:00Z",
        "isCurrent": true
      },
      {
        "id": "session_456",
        "device": "Safari on iPhone",
        "location": "Busan, South Korea",
        "ipAddress": "789.012.xxx.xxx",
        "lastActivity": "2024-01-14T18:45:00Z",
        "createdAt": "2024-01-12T14:30:00Z",
        "isCurrent": false
      }
    ]
  }
}
```

---

## 9. 기기 관리 및 신뢰할 수 있는 기기

### 기기 핑거프린팅

```javascript
const crypto = require('crypto');

const generateDeviceFingerprint = (req) => {
  const components = [
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.headers['accept-encoding'],
    req.ip,
    // 클라이언트에서 전송한 추가 정보
    req.body.screenResolution,
    req.body.timezone,
    req.body.platform,
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};
```

### 신뢰할 수 있는 기기 등록

```javascript
const trustedDeviceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  deviceFingerprint: { type: String, required: true },
  deviceName: { type: String },  // 사용자 지정 이름
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
  },
  trustExpiresAt: { type: Date },  // null = 영구 신뢰
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

// 신뢰 기기에서는 2FA 스킵
const shouldSkip2FA = async (userId, deviceFingerprint) => {
  const trustedDevice = await TrustedDevice.findOne({
    userId,
    deviceFingerprint,
    $or: [
      { trustExpiresAt: null },
      { trustExpiresAt: { $gt: new Date() } },
    ],
  });
  
  return !!trustedDevice;
};
```

### API 설계

```
GET /api/auth/devices
→ 등록된 기기 목록

POST /api/auth/devices/trust
→ 현재 기기를 신뢰할 수 있는 기기로 등록

DELETE /api/auth/devices/:deviceId
→ 신뢰 기기 해제

PUT /api/auth/devices/:deviceId/name
→ 기기 이름 변경
```

---

## 📊 고도화 기능 비교표

| 기능 | 보안 수준 | 사용자 편의성 | 구현 복잡도 | 권장 사용 |
|------|----------|--------------|------------|----------|
| **TOTP** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 낮음 | 필수 구현 권장 |
| **Passkey** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 중간 | 차세대 표준 |
| **SMS OTP** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 낮음 | SIM 스와핑 위험 |
| **매직 링크** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 낮음 | B2B, 내부 서비스 |
| **소셜 로그인** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 중간 | B2C 필수 |
| **SAML SSO** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 높음 | Enterprise |

---

## 🎯 권장 구현 순서

### Phase 1: 기본 강화
1. ✅ 기본 JWT 인증 (이미 완료)
2. TOTP 기반 2FA
3. 이메일 인증
4. 활성 세션 관리

### Phase 2: 사용자 편의
5. 소셜 로그인 (Google, Kakao)
6. 기기 관리 및 신뢰 기기
7. 매직 링크

### Phase 3: 미래 대비
8. Passkey (WebAuthn)
9. 적응형 MFA
10. SAML/OIDC SSO (Enterprise)

---

## 📚 참고 라이브러리

```json
{
  "dependencies": {
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "@simplewebauthn/server": "^9.0.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-kakao": "^1.0.1",
    "twilio": "^4.20.0",
    "nodemailer": "^6.9.0",
    "saml2-js": "^4.0.0",
    "openid-client": "^5.6.0",
    "ua-parser-js": "^1.0.0",
    "geoip-lite": "^1.4.0"
  }
}
```

