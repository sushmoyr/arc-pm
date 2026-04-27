import type { Database } from 'better-sqlite3';
import { ProjectRepo } from '../repositories/projectRepo.js';
import { TaskRepo } from '../repositories/taskRepo.js';
import { WorklogRepo } from '../repositories/worklogRepo.js';
import { DependencyRepo } from '../repositories/dependencyRepo.js';
import type { Dependency, Project, Task, Worklog } from '../types/domain.js';
import { NotFoundError } from '../utils/errors.js';

export const EXPORT_VERSION = '0.1.0';

export interface ProjectExport {
  version: string;
  exported_at: string;
  project: Project;
  tasks: Task[];
  worklogs: Worklog[];
  dependencies: Dependency[];
}

export class ExportService {
  private readonly projects: ProjectRepo;
  private readonly tasks: TaskRepo;
  private readonly worklogs: WorklogRepo;
  private readonly deps: DependencyRepo;

  constructor(db: Database) {
    this.projects = new ProjectRepo(db);
    this.tasks = new TaskRepo(db);
    this.worklogs = new WorklogRepo(db);
    this.deps = new DependencyRepo(db);
  }

  buildProjectExport(projectId: string): ProjectExport {
    const project = this.projects.findById(projectId);
    if (!project) throw new NotFoundError(`project '${projectId}' not found`);
    return {
      version: EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      project,
      tasks: this.tasks.findAll({ project_id: projectId }),
      worklogs: this.worklogs.listForProject(projectId),
      dependencies: this.deps.listForProject(projectId),
    };
  }
}
