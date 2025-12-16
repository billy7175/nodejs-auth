import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

class CreateUserDto {
  email: string;
  password: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  hello(): string {
    return this.appService.hello();
  }

  @Get('test')
  test(): string {
    return this.appService.test();
  }

  @Post('signup')
  // @Body() 데코레이터: 클라이언트가 POST 요청 시 body에 보낸 JSON 데이터를 자동으로 파싱하여 받아옴
  // 예: { "email": "user@example.com", "password": "password123" }
  create(@Body() body: CreateUserDto): { message: string; email: string } {
    return this.appService.create(body.email, body.password);
  }

  // @Param() 데코레이터: URL 경로에 포함된 동적 파라미터를 받아옴 *단일 파라미터만
  // 예: GET /users/123 -> id = "123"
  @Get('users/:id')
  findOne(@Param('id') id: string): { id: string; message: string } {
    return this.appService.findOne(id);
  }

  // 객체로 전체 params 받기 (Express의 req.params와 동일)
  // 예: GET /users/123/posts/456 -> params = { userId: "123", postId: "456" }
  @Get('users/:userId/posts/:postId')
  findUserPost(@Param() params: { userId: string; postId: string }): {
    userId: string;
    postId: string;
    message: string;
  } {
    return this.appService.findUserPost(params.userId, params.postId);
  }

  // @Query() 데코레이터: URL 쿼리 스트링을 받아옴
  // 예: GET /users?page=1&limit=10 -> page = "1", limit = "10"
  // - page: string = '1' (default parameter)
  //   → 쿼리에 page가 없으면 자동으로 '1' 사용
  //   → 타입: string (항상 값이 있음, undefined 불가능)
  //   → 예: GET /users → page = '1'
  //
  // - limit?: string (optional parameter)
  //   → 쿼리에 limit이 없으면 undefined
  //   → 타입: string | undefined
  //   → 예: GET /users → limit = undefined
  //   → 서비스에서 limit || '10' 처리가 필요
  @Get('users')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit?: string,
  ): { page: string; limit: string; message: string } {
    return this.appService.findAll(page, limit);
  }

  // 객체로 전체 query 받기 (Express의 req.query와 동일)
  // 예: GET /search?keyword=test&page=1&limit=10 -> query = { keyword: "test", page: "1", limit: "10" }
  // ⚠️ 주의: 객체로 받는 경우는 default parameter를 사용할 수 없음 (서비스에서 || '' 처리 필요)
  @Get('search')
  search(@Query() query: { keyword?: string; page?: string; limit?: string }): {
    keyword: string;
    page: string;
    limit: string;
    message: string;
  } {
    return this.appService.search(query);
  }

  // 개별 파라미터로 받기 (keyword만 default parameter 사용 가능으로 설정)
  // 예: GET /search2?keyword=test&page=1&limit=10
  // keyword만 default parameter로 기본값 '' 설정 가능
  // - keyword: string = '' (default parameter, 항상 값이 있음)
  // - page?: string, limit?: string (optional parameter, undefined 가능)
  // 내부 로직은 동일하므로 같은 서비스 메서드 사용
  @Get('search2')
  search2(
    @Query('keyword') keyword: string = '',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): { keyword: string; page: string; limit: string; message: string } {
    // 개별 파라미터를 객체로 변환하여 같은 서비스 메서드 호출
    return this.appService.search({ keyword, page, limit });
  }
}
