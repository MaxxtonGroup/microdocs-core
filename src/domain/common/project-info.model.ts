import { ProjectLink } from "./project-link.model";

export interface ProjectInfo {

  title?: string,
  group?: string,
  tag?: string,
  tags?: string[],
  links ?: ProjectLink[],
  description?: string,
  sourceLink?: string,
  publishTime?: string,
  updateTime?: string,
  color?: string,
  postmanCollection?: string

}