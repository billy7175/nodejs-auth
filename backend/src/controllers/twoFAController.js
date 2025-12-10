const User = require('../models/User');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const crypto = require('crypto');

/**
 * 2FA 설정 시작 (QR 코드 생성)
 * POST /api/auth/2fa/setup
 */
const setup2FA = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('+totpSecret');
    console.log('#user', user);

    if (!user) {
      return errorResponse(res, 404, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    // 이미 2FA가 활성화되어 있으면 기존 secret 반환
    if (user.is2FAEnabled && user.totpSecret) {
      // secret을 그대로 사용하여 URL 구성
      const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
      const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
      const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      return successResponse(res, 200, '2FA가 이미 활성화되어 있습니다', {
        qrCodeUrl,
        secret: user.totpSecret,
        otpauthUrl,
      });
    }

    // 이미 secret이 있지만 활성화되지 않은 경우 - 기존 secret 유지
    if (user.totpSecret && !user.is2FAEnabled) {
      // 현재 secret으로 생성되는 코드 확인 (검증용)
      const testCode = authenticator.generate(user.totpSecret);
      
      // secret이 올바른 형식인지 검증
      let secretValid = false;
      try {
        const verifyTest = authenticator.verify({
          token: testCode,
          secret: user.totpSecret,
          window: [0, 0],
        });
        secretValid = verifyTest;
      } catch (error) {
        console.error('Secret 검증 실패:', error);
        // Secret이 손상되었을 수 있음 - 초기화 필요
        user.totpSecret = null;
        user.backupCodes = [];
        await user.save();
        // 아래에서 새 secret 생성으로 진행
      }
      
      if (secretValid) {
        console.log('✅ 기존 secret 사용 (검증 성공):', {
          userId: userId,
          secretLength: user.totpSecret.length,
          secretPreview: user.totpSecret.substring(0, 10) + '...',
          currentCode: testCode,
          message: '이 secret으로 생성된 코드를 Google Authenticator에서 확인하세요',
        });
        
        // 기존 secret을 그대로 사용하여 URL 구성
        const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
        const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
        const otpauthUrl = `otpauth://totp/${label}?secret=${user.totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
        
        // 검증: URL의 secret이 원본과 일치하는지 확인
        const parsedSecret = otpauthUrl.match(/secret=([^&]+)/);
        if (parsedSecret && parsedSecret[1] !== user.totpSecret) {
          console.error('❌ otpauth URL의 secret이 원본과 일치하지 않습니다!');
          // Secret이 손상되었을 수 있음 - 초기화
          user.totpSecret = null;
          user.backupCodes = [];
          await user.save();
          // 아래에서 새 secret 생성으로 진행
          secretValid = false;
        } else {
          console.log('✅ 기존 secret으로 otpauth URL 생성 (원본 secret 유지)');
        }

        // secretValid가 false이면 새 secret 생성으로 진행
        if (!secretValid) {
          // 아래에서 새 secret 생성으로 진행
        } else {
          const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

          return successResponse(res, 200, '기존 설정을 계속 진행하세요', {
            qrCodeUrl,
            secret: user.totpSecret,
            otpauthUrl,
            message: '이미 QR 코드를 스캔했다면 Google Authenticator의 코드를 입력하세요.',
            existingSecret: true,
            hint: `서버 콘솔에서 현재 코드 확인: ${testCode}`,
            warning: 'Google Authenticator의 코드가 맞지 않다면 "2FA 초기화" 후 다시 시도하세요.',
          });
        }
      }
      // secret이 유효하지 않으면 아래에서 새로 생성
    }

    // 새로운 secret 생성 (처음 설정하거나 기존 secret이 유효하지 않은 경우)
    const secret = authenticator.generateSecret();
    
    // Secret이 올바르게 생성되었는지 즉시 검증
    const initialCode = authenticator.generate(secret);
    
    const secretValidation = authenticator.verify({
      token: initialCode,
      secret: secret,
      window: [0, 0],
    });
    
    if (!secretValidation) {
      console.error('❌ 생성된 secret이 유효하지 않습니다!');
      return errorResponse(res, 500, 'Secret 생성 중 오류가 발생했습니다. 다시 시도해주세요.', null, 'SECRET_GENERATION_ERROR');
    }
    
    console.log('✅ 새로운 secret 생성 및 검증 성공:', {
      secretLength: secret.length,
      secretPreview: secret.substring(0, 10) + '...',
      initialCode: initialCode,
    });

    // otpauth URL 생성
    const label = encodeURIComponent(`${process.env.APP_NAME || 'MyApp'} (${user.email})`);
    const issuer = encodeURIComponent(process.env.APP_NAME || 'MyApp');
    const otpauthUrl = authenticator.keyuri(label, issuer, secret);
    
    console.log('✅ otpauth URL 생성 완료:', {
      secretInUrl: otpauthUrl.match(/secret=([^&]+)/)?.[1]?.substring(0, 10) + '...',
      originalSecret: secret.substring(0, 10) + '...',
    });

    // QR 코드 생성
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // 백업 코드 생성 (10개)
    const backupCodes = [];
    const backupCodeHashes = [];
    
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const codeHash = await bcrypt.hash(code, 10);
      backupCodes.push(code);
      backupCodeHashes.push({
        codeHash,
        used: false,
      });
    }

    // secret과 백업 코드 저장 (아직 활성화 안 함)
    user.totpSecret = secret;
    user.backupCodes = backupCodeHashes;
    await user.save();

    // 저장 후 다시 읽어서 확인 및 검증
    const savedUser = await User.findById(userId).select('+totpSecret');
    
    if (!savedUser.totpSecret || savedUser.totpSecret !== secret) {
      console.error('❌ Secret 저장 실패:', {
        original: secret.substring(0, 10) + '...',
        saved: savedUser.totpSecret ? savedUser.totpSecret.substring(0, 10) + '...' : 'null',
      });
      return errorResponse(res, 500, 'Secret 저장 중 오류가 발생했습니다. 다시 시도해주세요.', null, 'SECRET_SAVE_ERROR');
    }
    
    // 저장된 secret으로 코드 생성하여 최종 검증
    const savedCode = authenticator.generate(savedUser.totpSecret);
    
    const finalValidation = authenticator.verify({
      token: savedCode,
      secret: savedUser.totpSecret,
      window: [0, 0],
    });
    
    console.log('✅ 새로운 2FA secret 생성 및 저장 완료:', {
      userId: userId,
      email: user.email,
      secretLength: secret.length,
      savedSecretLength: savedUser.totpSecret.length,
      secretMatch: secret === savedUser.totpSecret,
      secretPreview: secret.substring(0, 10) + '...',
      savedCode: savedCode,
      finalValidation: finalValidation,
    });
    
    if (!finalValidation) {
      console.error('❌ 저장된 secret 검증 실패!');
      return errorResponse(res, 500, 'Secret 검증 중 오류가 발생했습니다. 다시 시도해주세요.', null, 'SECRET_VALIDATION_ERROR');
    }

    return successResponse(res, 200, '2FA 설정 준비 완료', {
      qrCodeUrl,
      secret: secret,
      otpauthUrl,
      backupCodes, // 이번에만 평문으로 반환
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2FA 검증 및 활성화
 * POST /api/auth/2fa/verify
 */
const verify2FA = async (req, res, next) => {
  try {
    let { code } = req.body;
    const userId = req.userId;

    // 코드 정리 (공백 제거, 문자열 변환)
    code = String(code).trim().replace(/\s/g, '');

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return errorResponse(res, 400, '6자리 숫자 코드를 입력해주세요', null, 'INVALID_CODE_FORMAT');
    }

    const user = await User.findById(userId).select('+totpSecret');

    if (!user || !user.totpSecret) {
      return errorResponse(res, 400, '2FA 설정을 먼저 진행해주세요', null, '2FA_NOT_SETUP');
    }

    // secret 확인 로그
    console.log('2FA 검증 시도:', {
      userId: userId,
      secretExists: !!user.totpSecret,
      secretLength: user.totpSecret ? user.totpSecret.length : 0,
      secretPreview: user.totpSecret ? user.totpSecret.substring(0, 10) + '...' : 'none',
      inputCode: code,
    });

    // OTP 코드 검증 (window를 2로 늘려서 전후 60초 허용)
    const isValid = authenticator.verify({
      token: code,
      secret: user.totpSecret,
      window: [2, 2], // 전후 60초 허용 (시간 동기화 문제 대비)
    });

    // 디버깅: 현재 시간과 secret 확인
    if (!isValid) {
      // 현재 시간 기반 코드 생성 (비교용)
      const currentCode = authenticator.generate(user.totpSecret);
      
      // 이전/다음 시간대 코드도 확인 (otplib은 time 옵션 직접 지원 안 함)
      const prevCode = authenticator.generate(user.totpSecret);
      const nextCode = authenticator.generate(user.totpSecret);
      
      // secret의 첫 10자리와 마지막 10자리 확인
      const secretStart = user.totpSecret ? user.totpSecret.substring(0, 10) : 'none';
      const secretEnd = user.totpSecret && user.totpSecret.length > 10 
        ? user.totpSecret.substring(user.totpSecret.length - 10) 
        : 'none';
      
      console.log('❌ OTP 검증 실패 - 상세 정보:', {
        inputCode: code,
        expectedCode: currentCode,
        prevCode: prevCode,
        nextCode: nextCode,
        secretExists: !!user.totpSecret,
        secretLength: user.totpSecret ? user.totpSecret.length : 0,
        secretStart: secretStart,
        secretEnd: secretEnd,
        userId: userId,
        timestamp: new Date().toISOString(),
        diagnosis: '입력한 코드가 이전/현재/다음 코드와 모두 일치하지 않습니다. Google Authenticator에 등록된 secret과 DB의 secret이 다릅니다.',
        solution: '1. "2FA 초기화" 버튼 클릭 2. Google Authenticator에서 계정 삭제 3. "2FA 설정 시작" 다시 클릭 4. 새 QR 코드 스캔',
      });
      
      return errorResponse(res, 401, '유효하지 않은 코드입니다. Google Authenticator에서 계정을 삭제하고 QR 코드를 다시 스캔해주세요.', null, 'INVALID_CODE');
    }

    // 2FA 활성화
    user.is2FAEnabled = true;
    await user.save();

    console.log('2FA 활성화 성공:', {
      userId: userId,
      email: user.email,
    });

    return successResponse(res, 200, '2FA가 성공적으로 활성화되었습니다', {
      enabled: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2FA 비활성화
 * POST /api/auth/2fa/disable
 */
const disable2FA = async (req, res, next) => {
  try {
    const { code, password } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId).select('+password +totpSecret');

    if (!user) {
      return errorResponse(res, 404, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    if (!user.is2FAEnabled) {
      return errorResponse(res, 400, '2FA가 활성화되어 있지 않습니다', null, '2FA_NOT_ENABLED');
    }

    // 비밀번호 확인
    if (password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return errorResponse(res, 401, '비밀번호가 올바르지 않습니다', null, 'INVALID_PASSWORD');
      }
    }

    // OTP 코드 또는 백업 코드 확인
    if (code) {
      // OTP 코드 검증
      const isValidOTP = authenticator.verify({
        token: String(code).trim(),
        secret: user.totpSecret,
        window: [2, 2],
      });

      if (!isValidOTP) {
        return errorResponse(res, 401, '유효하지 않은 코드입니다', null, 'INVALID_CODE');
      }
    }

    // 2FA 비활성화
    user.is2FAEnabled = false;
    user.totpSecret = null;
    user.backupCodes = [];
    await user.save();

    return successResponse(res, 200, '2FA가 비활성화되었습니다', {
      enabled: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2FA 초기화 (secret 삭제 후 재설정)
 * POST /api/auth/2fa/reset
 */
const reset2FA = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, '사용자를 찾을 수 없습니다', null, 'USER_NOT_FOUND');
    }

    // secret 초기화
    user.totpSecret = null;
    user.is2FAEnabled = false;
    user.backupCodes = [];
    await user.save();

    console.log('2FA 초기화 완료:', {
      userId: userId,
      email: user.email,
    });

    return successResponse(res, 200, '2FA가 초기화되었습니다. 다시 설정해주세요.', {
      reset: true,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setup2FA,
  verify2FA,
  disable2FA,
  reset2FA,
};
