import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
