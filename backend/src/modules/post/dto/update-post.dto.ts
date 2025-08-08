import { IsString, IsOptional, MinLength, IsArray } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Title cannot be empty' })
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Content cannot be empty' })
  content?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
} 