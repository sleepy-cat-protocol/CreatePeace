import { IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Matches(/^https?:\/\/.+/, { message: 'Avatar URL must be a valid HTTP or HTTPS URL' })
  avatar_url?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
