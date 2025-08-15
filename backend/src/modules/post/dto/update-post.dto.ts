import { IsString, IsOptional, MinLength, IsArray, IsInt, IsBoolean, IsIn, IsDateString } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Title cannot be empty' })
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Content cannot be empty' })
  content?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  // Creative work fields
  @IsInt()
  @IsOptional()
  word_count?: number;

  @IsInt()
  @IsOptional()
  chapter_count?: number;

  @IsBoolean()
  @IsOptional()
  is_complete?: boolean;

  // Content warnings and ratings
  @IsString()
  @IsOptional()
  content_warning?: string;

  @IsString()
  @IsOptional()
  @IsIn(['G', 'T', 'M', 'E'], { message: 'Rating must be G, T, M, or E' })
  rating?: string;

  // Media
  @IsString()
  @IsOptional()
  featured_image?: string;

  // Publishing
  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'], { message: 'Invalid status' })
  status?: string;

  @IsDateString()
  @IsOptional()
  scheduled_for?: string;
} 