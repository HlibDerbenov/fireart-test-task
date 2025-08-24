import { IsString } from 'class-validator';
import { NewPasswordDto } from '../../common/base.dto';

export class ResetPasswordDto extends NewPasswordDto {
  @IsString()
  token!: string;
}
