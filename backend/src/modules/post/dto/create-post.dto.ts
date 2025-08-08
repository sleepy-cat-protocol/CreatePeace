import { IsString, IsNotEmpty, MinLength, IsArray, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Title cannot be empty' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Content cannot be empty' })
  content: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
} 