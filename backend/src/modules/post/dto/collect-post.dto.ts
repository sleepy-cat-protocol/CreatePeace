import { IsUUID } from 'class-validator';

export class CollectPostDto {
  @IsUUID()
  postId: string;
}
