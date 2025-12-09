const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다'],
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다'],
      minlength: [8, '비밀번호는 최소 8자 이상이어야 합니다'],
      select: false, // 기본적으로 조회 시 비밀번호 제외
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다'],
      trim: true,
      maxlength: [50, '이름은 50자를 초과할 수 없습니다'],
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// 비밀번호 해싱 (저장 전 자동 실행)
userSchema.pre('save', async function (next) {
  // 비밀번호가 수정되지 않았으면 스킵
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// JSON 변환 시 민감한 정보 제외
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

// 인덱스 생성 (email은 unique: true로 이미 인덱스가 생성됨)
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

