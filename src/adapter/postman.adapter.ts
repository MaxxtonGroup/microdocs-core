import { Project, Schema, Path, ProjectInfo, ProjectTree, SchemaTypes, ParameterPlacings } from "../domain";
import { BaseAdapter } from './base.adapter';

export abstract class PostmanAdapter implements BaseAdapter {

  adapt(project: Project): {}[] {
    var items: {}[] = [];
    if (project.paths != undefined) {
      for (var path in project.paths) {
        for (var method in project.paths[path]) {
          var item = this.getPostmanItem(path, method, project.paths[path][method]);
          items.push(item);
        }
      }
    }
    return items;
  }

  /**
   * To be implemented by the client, since the implementation heavily
   * depends on the project.
   */
  abstract getPostmanBase(project?: Project): {};

  getPostmanItem(path: string, method: string, endpoint: Path): {} {
    var url: string = "{{baseUrl}}" + path;
    var body: {} = {};
    var responses: {}[] = [];
    if (endpoint.parameters != undefined) {
      //replace path variables
      endpoint.parameters.filter(param => param.in == ParameterPlacings.PATH).forEach(param => {
        var generatedValue = '{{' + param.name + '}}';
        if (param.default != undefined) {
          generatedValue = param.default;
        }
        url.replace(new RegExp("{{" + param.name + "}}", 'g'), generatedValue);
      });

      // replace query params
      endpoint.parameters.filter(param => param.in == ParameterPlacings.QUERY).forEach(param => {
        var generatedValue = '{{' + param.name + '}}';
        if (param.default != undefined) {
          generatedValue = param.default;
        }
        if (url.indexOf("?") == -1) {
          url += '?';
        } else {
          url += '&';
        }
        url += encodeURIComponent(param.name) + '=' + encodeURIComponent(generatedValue);
      });

      // add body
      endpoint.parameters.filter(param => param.in == ParameterPlacings.BODY).forEach(param => {
        body = {
          mode: 'raw',
          raw: JSON.stringify(param.default, null, '  ')
        };
      });
    }

    if (endpoint.responses != undefined) {
      var defaultResponse = endpoint.responses['default'];
      if (Object.keys(endpoint.responses).length == 1 && defaultResponse != undefined) {
        var response: any = {};
        if (defaultResponse.schema != undefined && defaultResponse.schema.default != undefined) {
          response.body = JSON.stringify(defaultResponse.schema.default, null, '  ');
        }
        responses.push(response);
      } else {
        for (var status in endpoint.responses) {
          var response: any = { status: status };
          if (endpoint.responses[status].schema != undefined && endpoint.responses[status].schema.default != undefined) {
            response.body = JSON.stringify(endpoint.responses[status].schema.default, null, '  ');
          } else if (defaultResponse.schema != undefined && defaultResponse.schema.default != undefined) {
            response.body = JSON.stringify(defaultResponse.schema.default, null, '  ');
          }
          responses.push(response);
        }
      }
    }

    return {
      name: path,
      request: {
        url: url,
        method: method.toUpperCase(),
        description: endpoint.description,
        body: body
      },
      response: responses
    };
  }
}
