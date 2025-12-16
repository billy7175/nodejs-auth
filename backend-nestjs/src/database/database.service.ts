import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { databaseConfig } from '../config/database.config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool(databaseConfig());

    // 연결 테스트
    try {
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL 연결 성공');
      client.release();

      // users 테이블 생성
      await this.createUsersTable();
    } catch (error) {
      console.error('❌ PostgreSQL 연결 실패:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  private async createUsersTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('✅ users 테이블 생성 완료');

      // 샘플 데이터 삽입 (테이블이 비어있을 때만)
      await this.insertSampleData();
    } catch (error) {
      console.error('❌ users 테이블 생성 실패:', error);
      throw error;
    }
  }

  private async insertSampleData() {
    try {
      // 기존 데이터 확인
      const checkQuery = 'SELECT COUNT(*) as count FROM users';
      const result = await this.pool.query(checkQuery);
      const count = parseInt(
        String((result.rows[0] as { count: string })?.count || '0'),
        10,
      );

      // 데이터가 없을 때만 샘플 데이터 삽입
      if (count === 0) {
        const insertQuery = `
          INSERT INTO users (email, password, name) VALUES
          ('user1@example.com', 'hashed_password_1', '홍길동'),
          ('user2@example.com', 'hashed_password_2', '김철수'),
          ('user3@example.com', 'hashed_password_3', '이영희')
          ON CONFLICT (email) DO NOTHING;
        `;
        await this.pool.query(insertQuery);
        console.log('✅ 샘플 데이터 삽입 완료 (3건)');
      } else {
        console.log(`ℹ️  기존 데이터 존재 (${count}건)`);
      }
    } catch (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
      // 샘플 데이터 삽입 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }
}
