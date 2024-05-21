import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Login } from 'src/entities/login';
import { LessThan, Repository } from 'typeorm';
import { LoginByPasswordBodyDto } from './dto/login-by-password.body.dto';
import { CodeService } from '../code/code.service';
import { responseError } from 'src/utils/response';
import { ErrorCode } from 'src/types/enum/error-code.enum';
import { UserService } from '../user/user.service';
import { comparePassword } from 'src/utils/encrypt/encrypt-password';
import { User } from 'src/entities/user';
import { JwtAuthService } from '../jwt-auth/jwt-auth.service';
import { RegisterBodyDto } from './dto/register.body.dto';
import { Cron } from '@nestjs/schedule';
import { userInfo } from 'os';
import { objectOmit } from '@catsjuice/utils';
import { parseSqlError } from 'src/utils/response/sql-error/parse-sql-error';

@Injectable()
export class AuthService {
  constructor(
    private readonly _codeSrv:CodeService,

    @InjectRepository(Login)
    private readonly _loginRepo: Repository<Login>,
    @Inject(forwardRef(() => UserService))
    private readonly _userSrv: UserService,
    @Inject(forwardRef(() => JwtAuthService))
    private readonly _jwtAuthSrv: JwtAuthService,
  ) { }

  @Cron('*/30 * * * * *')
  public async clearExpiredLogin() {
    await this._loginRepo.delete({
      expireAt: LessThan(new Date()),
    })
  }

  /** 注册 */
  public async register(body: RegisterBodyDto, req: FastifyRequest) {
    const user = this._userSrv.qb().where('account=:account', { account: body.account })
    if (user)
      responseError(ErrorCode.USER_ACCOUNT_REGISTERED)

    // 校验验证码
    const { code, bizId, ...userInfo } = body
    const res=await this._codeSrv.verifyCaptcha(bizId, [req.raw.ip, code])
    if (!res)
      responseError(ErrorCode.AUTH_CODE_NOT_MATCHED)

    // 创建用户
    try {
      const user = await this._userSrv.createUser(userInfo)
      const sign = await this._jwtAuthSrv.signLoginAuthToken(user)
      return {
        sign,
        user:objectOmit(user,['password'])
      }
    } catch (error) {
      const sqlError = parseSqlError(error)
      if (sqlError === SqlError.DUPLICATE_ENTRY)
        responseError(ErrorCode.USER_EXISTED, '账号已注册')
      throw error
    }
  }

  /** 账号/邮箱+密码登录 */
  public async loginByPassword(body: LoginByPasswordBodyDto, ip: string) {
    const {account,email,code,bizId,password}=body

    if (!account && !email) {
      throw new Error('账号或邮箱至少需要填写一个');
    }
    if (!(await this._codeSrv.verifyCaptcha(bizId, [ip, code]))) {
      responseError(ErrorCode.AUTH_CODE_NOT_MATCHED)
    }

    const qb = this._userSrv.qb().addSelect('u.password')
    if (account)
      qb.where('u.account = :account', { account })
    else
      qb.where('u.email = :email', { email })

    const user = await qb.getOne()

    if (!user)
      responseError(ErrorCode.USER_ACCOUNT_NOT_REGISTERED)

    // 用户是否被禁用
    if (user.isDeleted)
      responseError(ErrorCode.USER_ACCOUNT_IS_DELETED)

    if (!user.password)
      responseError(ErrorCode.AUTH_PASSWORD_IS_NULL)

    // 校验密码
    const correct = await comparePassword(password, user.password)
    if (!correct)
      responseError(ErrorCode.AUTH_PASSWORD_NOT_MATCHED)

    return await this.signLoginTicket(user)
  }

  /** 退出登录 */
  public async logout(token:string) {
    await this._jwtAuthSrv.destroyLoginAuthToken(token)
    return true
  }

  /**签发登录token */
  public async signLoginTicket(user: Partial<User>) {
    const sign = await this._jwtAuthSrv.signLoginAuthToken(user)
    return {
      sign,
      user: {
        ...user,
        password: !!user.password,
      },
    }
  }

  public repo() {
    return this._loginRepo;
  }
}
