import type { Database } from 'better-sqlite3';
import { ProjectRepo } from '../repositories/projectRepo.js';
import { NewProjectInput, type Project } from '../types/domain.js';
import { ValidationError } from '../utils/errors.js';

export class ProjectService {
  private readonly repo: ProjectRepo;

  constructor(private readonly db: Database) {
    this.repo = new ProjectRepo(db);
  }

  create(raw: unknown): Project {
    const input = NewProjectInput.parse(raw);
    if (this.repo.exists(input.id)) {
      throw new ValidationError(`project '${input.id}' already exists`);
    }
    return this.repo.create(input);
  }

  list(): Project[] {
    return this.repo.findAll();
  }

  get(id: string): Project | null {
    return this.repo.findById(id);
  }

  update(id: string, fields: Partial<Pick<Project, 'name' | 'description' | 'tech_stack'>>): Project {
    if (!this.repo.exists(id)) throw new ValidationError(`project '${id}' not found`);
    return this.repo.update(id, fields);
  }

  countTasks(id: string): number {
    return this.repo.countTasks(id);
  }

  delete(id: string): void {
    if (!this.repo.exists(id)) throw new ValidationError(`project '${id}' not found`);
    this.repo.delete(id);
  }
}
