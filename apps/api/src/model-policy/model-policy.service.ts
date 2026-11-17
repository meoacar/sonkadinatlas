import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModelPolicyService {
  constructor(private prisma: PrismaService) { }

  private parseToolsJson(raw: any): string[] {
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  async findAll(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = params || {};
    const skip = (page - 1) * limit;
    const allowedSort = ['createdAt', 'updatedAt', 'plan', 'provider', 'modelName', 'temperature', 'maxTokens'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'updatedAt';
    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' || sortOrder === 'ascend' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.modelPolicy.findMany({
        skip,
        take: limit,
        orderBy: { [safeSortBy]: safeSortOrder },
      }),
      this.prisma.modelPolicy.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const policy = await this.prisma.modelPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`ModelPolicy with ID ${id} not found`);
    }

    return policy;
  }

  async findByPlan(plan: 'free' | 'premium') {
    return this.prisma.modelPolicy.findFirst({
      where: { plan },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: {
    plan: 'free' | 'premium';
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
    modelName: string;
    temperature: number;
    maxTokens: number;
    toolsEnabledJson?: string[] | string;
  }) {
    return this.prisma.modelPolicy.create({
      data: {
        ...data,
        toolsEnabledJson: this.parseToolsJson(data.toolsEnabledJson),
      },
    });
  }

  async update(
    id: string,
    data: {
      plan?: 'free' | 'premium';
      provider?: 'openai' | 'anthropic' | 'google' | 'deepseek';
      modelName?: string;
      temperature?: number;
      maxTokens?: number;
      toolsEnabledJson?: string[] | string;
    },
  ) {
    const policy = await this.findOne(id);

    return this.prisma.modelPolicy.update({
      where: { id: policy.id },
      data: {
        ...data,
        ...(data.toolsEnabledJson !== undefined
          ? { toolsEnabledJson: this.parseToolsJson(data.toolsEnabledJson) }
          : {}),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const policy = await this.findOne(id);

    return this.prisma.modelPolicy.delete({
      where: { id: policy.id },
    });
  }
}
