import { Project, Schema, Path, ProjectInfo, ProjectTree, SchemaTypes, Parameter } from "../domain";
import { BaseAdapter } from './base.adapter';

export class SwaggerAdapter implements BaseAdapter {

  adapt(project: Project): {} {
    project.swagger = "2.0";
    delete project.dependencies;
    delete project.components;
    delete project.problems;
    delete project.problemCount;
    delete project.info?.publishTime;
    delete project.info?.updateTime;
    delete project.info?.color;

    if (project.info != undefined) {
      project.info = SwaggerAdapter.convertInfo(project.info);
    }

    if (project.definitions != undefined) {
      for (const key in project.definitions) {
        this.convertDefinition(project.definitions[key]);
      }
    }
    if (project.paths != undefined) {
      for (let path in project.paths) {
        console.log(path);
        for (let method in project.paths[path]) {
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
    delete path.problems;
    delete path.path;
    delete path.requestMethod;

    // operation id's must be unique, which is pretty hard over a range of controllers, so we're faking it
    if (path.method.$ref) {
      path.operationId = path.method.$ref?.replace("#/components/", "").replace("/methods/", ".");
    }
    // and now delete the method too
    delete path.method;

    if (path.parameters != undefined) {
      path.parameters.forEach(parameter => {
        if (parameter.schema != undefined) {
          this.convertDefinition(parameter.schema);
        }
        parameter.type = SwaggerAdapter.convertType(parameter.type);
        delete parameter.enum;
      });
    }
    if (path.responses != undefined) {
      if (Object.keys(path.responses).length == 0) {
        path.responses['default'] = {
          description: 'default response'
        };
      } else {
        for (let key in path.responses) {
          const response = path.responses[ key ];
          if (response.schema) {
            this.convertDefinition(response.schema);
          }
          if (key === "default" && !response.description) {
            response.description = "default response";
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
    delete schema.sourceLink;

    if (!schema.default) {
      delete schema.default;
    }

    if (schema.properties != undefined) {
      for (let key in schema.properties) {
        let property = schema.properties[key];
        property.type = SwaggerAdapter.convertType(property.type);
        delete property.enum;
        this.convertDefinition(property);
      }
    }
    if (schema.items != undefined) {
      this.convertDefinition(schema.items);
    }
    if (schema.type && (schema.type === SchemaTypes.ENUM || schema.type === SchemaTypes.DATE)) {
      schema.type = SwaggerAdapter.convertType(schema.type);
      delete schema.enum;
    }
  }

  private static convertInfo(info: ProjectInfo): any {
    let jsonInfo: any = JSON.parse(JSON.stringify(info));
    delete jsonInfo.group;
    delete jsonInfo.versions;
    delete jsonInfo.links;
    delete jsonInfo.sourceLink;
    return jsonInfo;
  }

  private static convertType(type: string): string {
    // convert parameter types
    // allowed: string, number, boolean, integer, array
    if (type === SchemaTypes.DATE) {
      type = SchemaTypes.STRING;
    }

    if (type === SchemaTypes.ENUM) {
      // see spec 3.0, support for enums https://swagger.io/docs/specification/data-models/enums/
      type = "string";
    }
    return type;
  }
}
