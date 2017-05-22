import { Project } from '../domain';

export interface BaseAdapter {
  adapt(project: Project): Project;
}
