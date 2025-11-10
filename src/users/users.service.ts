import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Lấy tất cả users với phân trang (Admin)
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy user theo ID (Admin)
  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'role', 'isActive', 'createdAt'],
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Tìm user theo username (Admin)
  async getUserByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'role', 'isActive', 'createdAt'],
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Khóa user (set isActive = false)
  async lockUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User is already locked');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return {
      message: 'User locked successfully',
      userId: user.id,
      username: user.username,
      isActive: user.isActive,
    };
  }

  // Mở khóa user (set isActive = true)
  async unlockUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('User is already unlocked');
    }

    user.isActive = true;
    await this.userRepository.save(user);

    return {
      message: 'User unlocked successfully',
      userId: user.id,
      username: user.username,
      isActive: user.isActive,
    };
  }

  // Toggle trạng thái active của user
  async toggleUserStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      message: `User ${user.isActive ? 'unlocked' : 'locked'} successfully`,
      userId: user.id,
      username: user.username,
      isActive: user.isActive,
    };
  }

  // Tìm user bằng username (sử dụng trong auth)
  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  // Tạo user (sử dụng trong auth signup)
  async createUser(username: string, password: string) {
    const user = this.userRepository.create({ username, password });
    return this.userRepository.save(user);
  }
}
