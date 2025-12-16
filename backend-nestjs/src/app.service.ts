import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  hello(): string {
    return 'Hello World!';
  }
  test(): string {
    return 'Test API is working';
  }
  create(email: string, password: string) {
    // TODO: 실제 회원가입 로직 구현 (password 해싱 등)
    void password; // 나중에 사용 예정
    return { message: 'User registered successfully', email };
  }
}
