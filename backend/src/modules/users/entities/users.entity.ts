export class UserEntity {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
  
    constructor(partial: Partial<UserEntity>) {
      Object.assign(this, partial);
    }
  }