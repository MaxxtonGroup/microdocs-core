import { Project } from "../../domain/project.model";
import { ProjectInfo } from "../../domain/common/project-info.model";
import { Dependency } from "../../domain/dependency/dependency.model";

/**
 * Merge multiple project into one
 * @param projects list of projects
 * @param info global information for the merged project
 * @return merged project
 */
export function mergeProjects(projects: Project[], info: { name: string, description: string, version: string, baseUrl: string }): Project {
  // setup merged project
  let mergedProject: Project = {
    info: new ProjectInfo(info.name, undefined, info.version, [info.version], [], info.description)
  };
  if (info.baseUrl) {
    // this can be done better using regex
    mergedProject.schemas = [info.baseUrl.split("://")[0]];
    mergedProject.host = info.baseUrl.split("://")[1].split("/")[0];
    mergedProject.basePath = info.baseUrl.split("://")[1].split("/")[1];
  }

  // add definition of each project
  projects.forEach(project => {
    // add paths
    if (project.paths) {
      if (!mergedProject.paths) {
        mergedProject.paths = {}
      }
      for (let path in project.paths) {
        if (!mergedProject.paths[path]) {
          mergedProject.paths[path] = {}
        }
        for (let method in project.paths[path]) {
          mergedProject.paths[path][method] = project.paths[path][method];
        }
      }
    }

    // add definitions
    if (project.definitions) {
      if (!mergedProject.definitions) {
        mergedProject.definitions = {}
      }
      for (let definition in project.definitions) {
        mergedProject.definitions[definition] = project.definitions[definition];
      }
    }
  });

  return mergedProject;
}
