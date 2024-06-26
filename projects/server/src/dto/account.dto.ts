import { decorate } from 'ts-mixer'
import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'
import type { IAccountDto, IAccountOptionalDto } from 'src/types/dto/account.interface'
import { IsValidAccount } from 'src/decorators/validators/is-valid-account'
import { sharedVariableMarkdown } from 'src/utils/docs/shared-variable'
import { ACCOUNT_MAX_LENGTH, ACCOUNT_MIN_LENGTH, ACCOUNT_REQUIREMENTS_DESC } from 'src/utils/validators/account.validator'
import { GenerateParamsDecorator } from 'src/utils/validators/params-decorator-gen'

function Decorator(optional = false) {
  return GenerateParamsDecorator(
    [
      ApiProperty({
        description: `账号，${ACCOUNT_REQUIREMENTS_DESC}
        ${sharedVariableMarkdown('ACCOUNT_REQUIREMENTS_DESC')}`,
        maxLength: ACCOUNT_MAX_LENGTH,
        minLength: ACCOUNT_MIN_LENGTH,
        type: () => String,
        example: 'admin',
      }),
      IsValidAccount(),
      MinLength(ACCOUNT_MIN_LENGTH, { message: `账号长度不能小于${ACCOUNT_MIN_LENGTH}位` }),
      MaxLength(ACCOUNT_MAX_LENGTH, { message: `账号长度不能大于${ACCOUNT_MAX_LENGTH}位` }),
      IsString({ message: '账号必须是字符串' }),
    ],
    optional,
  )
}

export class AccountDto implements IAccountDto {
  @decorate(Decorator())
  account: string
}

export class AccountOptionalDto implements IAccountOptionalDto {
  @decorate(Decorator(true))
  account?: string
}
