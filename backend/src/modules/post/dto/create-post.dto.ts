import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Title cannot be empty' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Content cannot be empty' })
  content: string;
} 