import { Project, Schema, Path, ProjectInfo, ProjectTree, SchemaTypes } from "../domain";
import { BaseAdapter } from './base.adapter';

export class SwaggerAdapter implements BaseAdapter {

  adapt(project: Project): {} {
    project.swagger = "2.0";
    delete project.dependencies;
    delete project.components;
    delete project.problems;
    delete project.problemCount;

    if (project.info != undefined) {
      project.info = this.convertInfo(project.info);
    }

    if (project.definitions != undefined) {
      for (var key in project.definitions) {
        this.convertDefinition(project.definitions[key]);
      }
    }
    if (project.paths != undefined) {
      for (var path in project.paths) {
        for (var method in project.paths[path]) {
          this.convertEndpoint(project.paths[path][method]);
        }
      }
    }
    else {
      project.paths = {};
    }
    return project;
  }

  private convertEndpoint(path: Path) {
    delete path.controller;
    delete path.method;
    delete path.problems;
    delete path.path;
    delete path.requestMethod;
    if (path.parameters != undefined) {
      path.parameters.forEach(parameter => {
        if (parameter.schema != undefined) {
          this.convertDefinition(parameter.schema);
        }
      });
    }
    if (path.responses != undefined) {
      if (Object.keys(path.responses).length == 0) {
        path.responses['default'] = {
          description: 'default response'
        };
      } else {
        for (var key in path.responses) {
          var response = path.responses[key];
          if (response.schema != undefined) {
            this.convertDefinition(response.schema);
          }
        }
      }
    }
  }

  private convertDefinition(schema: Schema) {
    delete schema.mappings;
    delete schema.name;
    delete schema.simpleName;
    delete schema.genericName;
    delete schema.genericSimpleName;
    if (schema.properties != undefined) {
      for (var key in schema.properties) {
        this.convertDefinition(schema.properties[key]);
      }
    }
    if (schema.items != undefined) {
      this.convertDefinition(schema.items);
    }
    if (schema.type == SchemaTypes.DATE) {
      schema.type = SchemaTypes.STRING;
    }
  }

  private convertInfo(info: ProjectInfo): any {
    let jsonInfo: any = JSON.parse(JSON.stringify(info));
    delete jsonInfo.group;
    delete jsonInfo.versions;
    delete jsonInfo.links;
    delete jsonInfo.sourceLink;
    return jsonInfo;
  }
}
