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
  findOne(id: string) {
    return { id, message: `User ${id} found` };
  }
  findUserPost(userId: string, postId: string) {
    return {
      userId,
      postId,
      message: `User ${userId}'s post ${postId} found`,
    };
  }
  findAll(page: string = '1', limit?: string) {
    // page: 항상 string (기본값 '1' 보장)
    // limit: string | undefined (없으면 undefined)
    return { page, limit: limit || '10', message: 'Users list' };
  }
  search(query: { keyword?: string; page?: string; limit?: string }) {
    // 공통 서비스 메서드: 객체로 받아서 처리
    // 객체로 받는 경우: default parameter 사용 불가능, 서비스에서 || '' 처리
    // 개별 파라미터로 받는 경우도 이 메서드를 사용 (컨트롤러에서 객체로 변환)
    return {
      keyword: query.keyword || '',
      page: query.page || '1',
      limit: query.limit || '10',
      message: 'Search results',
    };
  }
}
