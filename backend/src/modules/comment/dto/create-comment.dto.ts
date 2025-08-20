import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string; // For nested replies
}
