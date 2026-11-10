import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { CompaniesService } from '../companies/companies.service.js';
import { CodeSnippet } from '../code-snippets/code-snippet.entity.js';
import type { SaveCodeSnippetDto } from '../code-snippets/dto/save-code-snippet.dto.js';
import type { UpdateCodeSnippetDto } from '../code-snippets/dto/update-code-snippet.dto.js';

@Injectable()
export class CodeSnippetsService {
  constructor(
    @InjectRepository(CodeSnippet)
    private readonly snippetsRepository: Repository<CodeSnippet>,
    private readonly companiesService: CompaniesService,
  ) {}

  async findAll(companyId: string): Promise<CodeSnippet[]> {
    await this.companiesService.findOne(companyId);
    return this.snippetsRepository.find({
      where: { companyId },
      order: { updatedAt: 'DESC' },
    });
  }

  async create(
    companyId: string,
    dto: SaveCodeSnippetDto,
  ): Promise<CodeSnippet> {
    await this.companiesService.findOne(companyId);
    const snippet = this.snippetsRepository.create({
      companyId,
      title: dto.title.trim(),
      language: dto.language,
      source: dto.source,
    });
    return this.snippetsRepository.save(snippet);
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateCodeSnippetDto,
  ): Promise<CodeSnippet> {
    const snippet = await this.findOne(companyId, id);
    if (dto.title !== undefined) snippet.title = dto.title.trim();
    if (dto.language !== undefined) snippet.language = dto.language;
    if (dto.source !== undefined) snippet.source = dto.source;
    return this.snippetsRepository.save(snippet);
  }

  async remove(companyId: string, id: string): Promise<void> {
    const snippet = await this.findOne(companyId, id);
    await this.snippetsRepository.remove(snippet);
  }

  private async findOne(companyId: string, id: string): Promise<CodeSnippet> {
    await this.companiesService.findOne(companyId);
    const snippet = await this.snippetsRepository.findOneBy({ id, companyId });
    if (!snippet) {
      throw new NotFoundException('Code snippet not found.');
    }
    return snippet;
  }
}
