import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}
  hello(): string {
    return 'Hello World!';
  }
  test(): string {
    return 'Test API is working';
  }
  async create(email: string, password: string, name: string) {
    // 이메일 중복 체크
    const existingUser = await this.databaseService.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // DB에 저장
    const result = await this.databaseService.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, created_at, name',
      [email, password, name],
    );

    const user = result.rows[0] as {
      id: string;
      email: string;
      created_at: Date;
      name: string;
    };
    console.log('#user', user);
    return {
      message: 'User registered successfully',
      email: user.email,
      id: user.id,
      name: user.name,
    };
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
