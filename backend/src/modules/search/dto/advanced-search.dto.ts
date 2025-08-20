import { IsOptional, IsString, IsEnum, IsDateString, IsIn } from 'class-validator';

export enum SearchType {
  ALL = 'all',
  POSTS = 'posts',
  USERS = 'users',
  TAGS = 'tags',
}

export enum SortBy {
  RELEVANCE = 'relevance',
  DATE = 'date',
  LIKES = 'likes',
  TITLE = 'title',
  NAME = 'name',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdvancedSearchDto {
  @IsString()
  q: string; // Search query

  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.ALL;

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Start date for publish time range

  @IsOptional()
  @IsDateString()
  dateTo?: string; // End date for publish time range

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RELEVANCE;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '20';
}
