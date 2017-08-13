import {ProjectLink} from "./project-link.model";

export interface ProjectInfo {

  title: string,
  group?: string,
  version: string,
  versions: string[],
  links ?: ProjectLink[],
  description?: string,
  sourceLink?: string,
  publishTime?:string,
  updateTime?:string,
  color?:string,
  postmanCollection?:string

}