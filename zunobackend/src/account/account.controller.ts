import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { response } from 'express';

@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) {}

  @Post()
  async createAcc(@Body() data: CreateAccountDto) {
    console.log('connected')
    this.accountService.createAcc(data);
    return {state : 200, message : 'createAcc successful'}
  }

  @Get()
  async getFindAll() {
    console.log('find')
    return await this.accountService.getFindAll();
    // console.log(data, ' find')
  }

  @Get(':user')
  async getFindOne(@Param('user') user : string){
    console.log(user)
    // console.log(await this.accountService.getFindOne(user))
    return await this.accountService.getFindOne(user)
  }
}
