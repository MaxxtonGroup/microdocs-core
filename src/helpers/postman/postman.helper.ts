

import { Project } from "../../domain/project.model";
import { Path } from "../../domain/path/path.model";
import { ParameterPlacings } from "../../domain/path/parameter-placing.model";

export class PostmanHelper {

  public convert(project:Project):{}{
    let collection = this.getPostmanBase(project);
    collection.item = this.getPostmanItems(project);

    return collection;
  }

  private getPostmanItems(project: Project): any[] {
    let items:{}[] = [];
    if (project.paths != undefined) {
      for(let path in project.paths){
        for(let method in project.paths[path]){
          let item = this.getPostmanItem(path, method, project.paths[path][method]);
          items.push(item);
        }
      }
    }
    return items;
  }

  private getPostmanItem(path:string, method:string, endpoint:Path):{}{
    let url:string = "{{baseUrl}}" + path;
    let body:{} = {};
    let responses:{}[] = [];
    let events:any[];
    if(endpoint.parameters != undefined){
      //replace path variables
      endpoint.parameters.filter(param => param.in == ParameterPlacings.PATH).forEach(param => {
        let generatedValue = '{{' + param.name + '}}';
        if(param.default != undefined){
          generatedValue = param.default;
        }
        url.replace(new RegExp("{{" + param.name + "}}", 'g'), generatedValue);
      });

      // replace query params
      endpoint.parameters.filter(param => param.in == ParameterPlacings.QUERY).forEach(param => {
        let generatedValue = '{{' + param.name + '}}';
        if(param.default != undefined){
          generatedValue = param.default;
        }
        if(url.indexOf("?") == -1){
          url += '?';
        }else{
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

    if(endpoint.responses != undefined){
      let defaultResponse = endpoint.responses['default'];
      if(Object.keys(endpoint.responses).length == 1 && defaultResponse != undefined){
        let response:any = {};
        if(defaultResponse.schema != undefined && defaultResponse.schema.default != undefined){
          response.body = JSON.stringify(defaultResponse.schema.default, null, '  ');
        }
        responses.push(response);
      }else{
        for(let status in endpoint.responses){
          let response:any = {status: status};
          if(endpoint.responses[status].schema != undefined && endpoint.responses[status].schema.default != undefined){
            response.body = JSON.stringify(endpoint.responses[status].schema.default, null, '  ');
          }else if(defaultResponse.schema != undefined && defaultResponse.schema.default != undefined){
            response.body = JSON.stringify(defaultResponse.schema.default, null, '  ');
          }
          responses.push(response);
        }
      }
    }

    if(endpoint.tests && endpoint.tests.length > 0){
      events = [];
      endpoint.tests.filter(test => test.listen && test.script).forEach(test => {
        events.push({
          listen: test.listen,
          script: test.script
        });
      });
    }

    return {
      name: path,
      request: {
        url: url,
        method: method.toUpperCase(),
        description: endpoint.description,
        body: body
      },
      response: responses,
      events: events
    };
  }

  private getPostmanBase(project:Project): any {
    let collection:any;
    collection['info'] = {
      name: project.info.title,
      version: project.info.version,
      description: project.info.description
    };
    collection.info.schema = "https://schema.getpostman.com/json/collection/v2.0.0/collection.json";
    const uuid = require('uuid');
    collection.info._postman_id = uuid['v4']();

    collection['variables'] = [
      {
        id: 'baseUrl',
        type: 'string',
        value: 'http://localhost'
      }
    ];


    return collection;
  }

}