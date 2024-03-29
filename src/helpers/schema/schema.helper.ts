import { Schema, SchemaTypes } from "../../domain";

/**
 * Helper class for generation example data based on schema and resolve references
 */
export class SchemaHelper {

  /**
   * Resolve schema and return an example object
   * @param schema
   * @param fieldName
   * @param objectStack
   * @param rootObject
   * @return example object
   */
  public static generateExample(schema: Schema, fieldName?: string, objectStack: string[] = [], rootObject?: {}): any {
    if (schema != undefined) {
      if (schema.type == SchemaTypes.OBJECT) {
        if (schema.name != undefined) {
          let sameObjects: string[] = objectStack.filter((object) => object == schema.name);
          if (sameObjects.length > 0) {
            return '[' + schema.name + ']';
          }
          objectStack.push(schema.name);
        }
      }
      schema = SchemaHelper.collect(schema, objectStack, rootObject);
      if (schema.default != undefined) {
        return schema.default;
      }
      if (schema.type == SchemaTypes.ENUM && schema.enum != undefined) {
        if (schema.enum.length == 0) {
          return "[" + schema.name + "]";
        }
        const random = Math.floor((Math.random() * schema.enum.length));
        return schema.enum[random];
      } else if (schema.type == SchemaTypes.BOOLEAN) {
        return true;
      } else if (schema.type == SchemaTypes.INTEGER) {
        return 13;
      } else if (schema.type == SchemaTypes.NUMBER) {
        return 13.6;
      } else if (schema.type == SchemaTypes.STRING) {
        return "string";
      } else if (schema.type == SchemaTypes.ARRAY) {
        const array: Array<any> = [];
        array.push(SchemaHelper.generateExample(schema.items, undefined, objectStack, rootObject));
        return array;
      } else if (schema.type == SchemaTypes.OBJECT) {
        const object: any = {};
        if (schema.allOf != undefined) {
          schema.allOf.forEach(superSchema => {
            const superObject = SchemaHelper.generateExample(superSchema, fieldName, objectStack.slice(), rootObject);
            for (let field in superObject) {
              object[field] = superObject[field];
            }
          });
        }
        for (const field in schema.properties) {
          const property = schema.properties[field];
          let name = field;
          const jsonName = SchemaHelper.resolveReference('mappings.json.name', property);
          const jsonIgnore = SchemaHelper.resolveReference('mappings.json.ignore', property);
          if (jsonIgnore != true) {
            if (jsonName != null) {
              name = jsonName;
            }

            object[name] = SchemaHelper.generateExample(property, name, objectStack.slice(), rootObject);
          }
        }
        return object;
      }
    }
    return null;
  }

  public static collect(schema: Schema, objectStack: string[] = [], rootObject?: {}): Schema {
    if (schema == undefined) {
      return schema;
    }
    if (schema.$ref != undefined) {
      if (schema.$ref.includes("com.maxxton")) {
        let newSchema = SchemaHelper.resolveReference(schema.$ref, rootObject);
        for (let key in newSchema) {
          schema[ key ] = newSchema[ key ];
        }
      }
    }
    if (schema.type == SchemaTypes.OBJECT) {
      if (schema.name != undefined) {
        const sameObjects: string[] = objectStack.filter((object) => object == schema.name);
        if (sameObjects.length > 0) {
          return schema;
        }
        objectStack.push(schema.name);
      }
      const fullSchema = schema;
      if (schema.allOf != undefined) {
        schema.allOf.forEach(superSchema => {
          if (superSchema){
            superSchema = SchemaHelper.collect(superSchema, objectStack, rootObject);
            if(superSchema.properties) {
              for (let key in superSchema.properties) {
                //todo: combine instead of override
                fullSchema.properties[key] = superSchema.properties[key];
              }
            }
          }
        });
      }
      if (schema.anyOf != undefined) {
        schema.anyOf = schema.anyOf.map(subSchema => {
          if (subSchema) {
            subSchema = SchemaHelper.collect(subSchema, objectStack, rootObject);
          }
          return subSchema;
        });
      }
      if (schema.properties != undefined) {
        for (let key in schema.properties) {
          //todo: combine instead of override
          fullSchema.properties[key] = SchemaHelper.collect(schema.properties[key], objectStack, rootObject);
        }
      }
      return fullSchema;
    } else {
      return schema;
    }
  }

  /**
   * Search for the reference in the object
   * @param reference href (eg. #/foo/bar) or path (eg. foo.bar)
   * @param vars object where to search in
   * @returns {any} object or null
   */
  public static resolveReference(reference: string, vars: any): any {
    if (reference != undefined || reference == null) {
      let currentObject = vars;
      let segments: string[] = [];
      if (reference.indexOf("#/") == 0) {
        // href
        segments = reference.substring(2).split("/");
      } else {
        // path
        segments = reference.split(".");
      }
      segments.forEach((segment) => {
        if (currentObject != undefined) {
          let resolvedName = segment;
          if (segment.indexOf('[') == 0 && segment.indexOf(']') == segment.length - 1) {
            const segmentName = segment.substring(1, segment.length - 1);
            resolvedName = SchemaHelper.resolveString('${' + segmentName + '}', vars);
          }
          currentObject = currentObject[resolvedName];
        }
      });
      if (currentObject == undefined) {
        currentObject = null;
      }
      return currentObject;
    }
    return null;
  }

  /**
   * Extract expressions from string
   * examples:
   *    "hello $name"
   *        -> [{isVar: false, expression: "hello "},{isVar: true, expression: "name"}]
   *    "hello ${name}"
   *        -> [{isVar: false, expression: "hello "},{isVar: true, expression: "name"}]
   *    "${someIndex|number}"
   *        -> [{isVar: true, expression: "someIndex", pipes:["number"]}]
   * @param string
   * @return {{isVar: boolean, expression: string, pipes?: string[]}[]}
   */
  public static extractStringSegments(string: string): {isVar: boolean, expression: string, pipes?: {name: string, args?: string[]}[]}[] {
    let newPipes: {name: string, args?: string[]}[];
    let currentPipe;
    let isEscaped = false;
    let isVar = false;
    let isBrackets = false;
    let isPipe = false;

    const segments: { isVar: boolean, expression: string, pipes?: { name: string, args?: string[] }[] }[] = [];
    let currentSegment: { isVar: boolean, expression: string, pipes?: { name: string, args?: string[] }[] } = null;
    for (let i = 0; i < string.length; i++) {
      const char = string.charAt(i);
      if (isEscaped) {
        isEscaped = false;
        if (isPipe) {
          if (currentSegment.pipes && currentSegment.pipes.length > 0) {
            currentPipe = currentSegment.pipes[currentSegment.pipes.length - 1];
            if (currentPipe.args && currentPipe.args.length > 0) {
              currentPipe.args[currentPipe.args.length - 1] += char;
            } else {
              currentPipe.name = currentPipe.name + char;
            }
          } else {
            currentSegment.pipes = [{name: char}];
          }
        } else {
          if (!currentSegment) {
            currentSegment = {isVar: isVar, expression: ""};
          }
          currentSegment.expression += char;
        }
      } else if (char === "\\") {
        isEscaped = true;
      } else if (isVar) {
        if ((!currentSegment || currentSegment.expression === '') && char === '{') {
          isBrackets = true;
        } else if (isBrackets && char === '}') {
          isVar = false;
          isPipe = false;
          isBrackets = false;
          if (currentSegment) {
            if (currentSegment.isVar) {
              currentSegment.expression = currentSegment.expression.trim();
              if (currentSegment.pipes) {
                newPipes = [];
                currentSegment.pipes.forEach((pipe => {
                  newPipes.push(pipe);
                }));
                currentSegment.pipes = newPipes;
              }
            }
            segments.push(currentSegment);
          }
          currentSegment = null;
        } else if (!isBrackets && char === ' ') {
          isVar = false;
          isPipe = false;
          if (currentSegment) {
            if (currentSegment.isVar) {
              currentSegment.expression = currentSegment.expression.trim();
              if (currentSegment.pipes) {
                newPipes = [];
                currentSegment.pipes.forEach(pipe => {
                  newPipes.push(pipe);
                });
                currentSegment.pipes = newPipes;
              }
            }
            segments.push(currentSegment);
          }
          currentSegment = {isVar: false, expression: " "};
        } else if (currentSegment && char === '|') {
          isPipe = true;
          if (!currentSegment.pipes || currentSegment.pipes.length == 0) {
            currentSegment.pipes = [{name: ''}];
          } else {
            currentSegment.pipes.push({name: ''});
          }
        } else if (currentSegment && isPipe) {
          if (currentSegment.pipes && currentSegment.pipes.length > 0) {
            currentPipe = currentSegment.pipes[ currentSegment.pipes.length - 1 ];
            if (char === ' ' && currentPipe.name !== '') {
              if (!currentPipe.args) {
                currentPipe.args = [''];
              } else {
                currentPipe.args.push('');
              }
            } else if (char !== ' ') {
              if (currentPipe.args && currentPipe.args.length > 0) {
                currentPipe.args[currentPipe.args.length - 1] += char;
              } else {
                currentPipe.name = currentPipe.name + char;
              }
            }
          } else {
            currentSegment.pipes = [{name: char}];
          }
        } else {
          if (!currentSegment) {
            currentSegment = {isVar: isVar, expression: ""};
          }
          currentSegment.expression += char;
        }
      } else if (char === "$") {
        isVar = true;
        if (currentSegment) {
          if (currentSegment.isVar) {
            currentSegment.expression = currentSegment.expression.trim();
            if (currentSegment.pipes) {
              newPipes = [];
              currentSegment.pipes.forEach(pipe => {
                newPipes.push(pipe);
              });
              currentSegment.pipes = newPipes;
            }
          }
          segments.push(currentSegment);
        }
        currentSegment = null;
      } else {
        if (!currentSegment) {
          currentSegment = {isVar: false, expression: ""};
        }
        currentSegment.expression += char;
      }
    }
    if (currentSegment) {
      if (currentSegment.isVar) {
        currentSegment.expression = currentSegment.expression.trim();
        if (currentSegment.pipes) {
          newPipes = [];
          currentSegment.pipes.forEach(pipe => {
            newPipes.push(pipe);
          });
          currentSegment.pipes = newPipes;
        }
      }
      segments.push(currentSegment);
    }
    return segments;
  }

  /**
   * Resolve string which contains references (eg. "hello ${foo.bar}")
   * @param string string to be resolved
   * @param vars
   * @returns {string} resolved string
   */
  public static resolveString(string: string, vars: {}): any {
    let result: any;
    const segments = SchemaHelper.extractStringSegments(string);
    segments.forEach(segment => {
      if (segment.isVar) {
        let resolvedObject = SchemaHelper.resolveReference(segment.expression.trim(), vars);
        if (resolvedObject != undefined) {
          if (segment.pipes) {
            segment.pipes.forEach(pipe => {
                if (pipe.name.trim() === 'integer' || pipe.name.trim() === 'int') {
                  resolvedObject = parseInt(resolvedObject);
                } else if (pipe.name.trim() === 'number' || pipe.name.trim() === 'float' || pipe.name.trim() === 'double') {
                  resolvedObject = parseFloat(resolvedObject);
                } else if (pipe.name.trim() === 'boolean') {
                  resolvedObject = Boolean(resolvedObject);
                } else if (pipe.name.trim() === 'string') {
                  resolvedObject = String(resolvedObject);
                } else if (pipe.name.trim() === 'json') {
                  resolvedObject = JSON.stringify(resolvedObject);
                } else if (pipe.name.trim() === 'uc') {
                  resolvedObject = resolvedObject.toUpperCase();
                } else if (pipe.name.trim() === 'lc') {
                  resolvedObject = resolvedObject.toLowerCase();
                } else if (pipe.name.trim() === 'replace') {
                  if (pipe.args.length >= 2) {
                    resolvedObject = resolvedObject.replace(new RegExp(pipe.args[0], 'g'), pipe.args[1]);
                  } else {
                    console.warn("Pipe replace requires 2 arguments ");
                  }
                } else {
                  console.warn("Unknown pipe: " + pipe);
                }
              }
            );
          }
          if (result) {
            result += resolvedObject;
          } else {
            result = resolvedObject;
          }
        }
      } else {
        if (result) {
          result += segment.expression;
        } else {
          result = segment.expression;
        }
      }
    });
    return result;
  }

  /**
   * Resolve references in a object
   * @param object
   * @param rootObject
   * @returns {{}}
   */
  public static resolveObject(object: any, rootObject ?: {}): {} {
    if (object != null) {
      let key;
      if (rootObject == undefined) {
        rootObject = object;
      }
      for (key in object) {
        const childObject = object[ key ];
        if (typeof(childObject) == SchemaTypes.OBJECT) {
          SchemaHelper.resolveObject(childObject, rootObject);
        } else if (typeof(childObject) == SchemaTypes.STRING && key != '$ref') {
          object[key] = SchemaHelper.resolveString(childObject, rootObject);
        }
      }
      if (object['$ref'] != undefined) {
        const refObject = SchemaHelper.resolveReference(object[ '$ref' ], rootObject);
        if (refObject != null) {
          for (key in refObject) {
            if (object[key] == undefined) {
              object[key] = refObject[key];
            }
          }
          delete object['$ref'];
        }
      }
    }
    return object;
  }

  /**
   * Set a property in an object
   * @param object object set the property off
   * @param key property key
   * @param value value
   */
  public static setProperty(object: {}, key: string, value: any): {} {
    const segments = key.split(".");
    let currentObject: any = object;
    let currentPath: string = null;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[ i ];
      if (currentPath) {
        currentPath += '.' + segment;
      } else {
        currentPath = segment;
      }
      if (i == segments.length - 1) {
        currentObject[segment] = value;
      } else {
        if (currentObject[segment]) {
          if (typeof(currentObject[segment]) === 'object' && !Array.isArray(currentObject[segment])) {
            currentObject = currentObject[segment];
          } else {
            throw new Error("Property " + currentPath + " already exists and is not an object");
          }
        } else {
          currentObject[segment] = {};
          currentObject = currentObject[segment];
        }
      }
    }

    return object;
  }

  /**
   * Remove a property in an object and remove empty objects it creates
   * @param object
   * @param key
   * @return {{}}
   */
  public static removeProperty(object: {}, key: string): {} {
    const segments = key.split(".");
    let currentObject: any = object;
    let currentPath: string = null;
    const objectStack: any = [];

    for (let i = 0; i < segments.length; i++) {
      objectStack.push(currentObject);
      const segment = segments[ i ];
      if (currentPath) {
        currentPath += '.' + segment;
      } else {
        currentPath = segment;
      }
      if (i == segments.length - 1) {
        delete currentObject[segment];
      } else {
        if (currentObject[segment]) {
          if (typeof(currentObject[segment]) === 'object' && !Array.isArray(currentObject[segment])) {
            currentObject = currentObject[segment];
          } else {
            throw new Error("Property " + currentPath + " already exists and is not an object");
          }
        } else {
          break;
        }
      }
    }

    for (let i = objectStack.length - 1; i >= 0; i--) {
      if (Object.keys(currentObject).length == 0) {
        if (i > 0) {
          delete objectStack[i - 1][segments[i - 1]];
        }
      }
    }

    return object;
  }

  /**
   * Merge remote into base, without override existing properties
   * @param base
   * @param remote
   */
  public static merge(base: any, remote: any) {
    for (let key in remote) {
      let remoteProp = remote[key];
      if (base[key] == undefined) {
        base[key] = remoteProp;
      } else {
        let baseProp = base[key];
        if (typeof(remoteProp) === 'object' && !Array.isArray(remoteProp) &&
          typeof(baseProp) === 'object' && !Array.isArray(baseProp)) {
          SchemaHelper.merge(baseProp, remoteProp);
        }
      }
    }
  }

  public static resolveCondition(condition: any, vars: {scope?: {}, project?: {}, settings?: {}, settingsScope?: {}}): boolean {
    let result: boolean;
    (function () {
      const scope = vars.scope;
      const project = vars.project;
      const settings = vars.settings;
      const settingsScope = vars.settingsScope;
      const $ = vars;
      if (typeof(condition) === 'string') {
        result = eval(condition);
      } else if (typeof(condition) === 'function') {
        result = condition($, scope, project, settings, settingsScope);
      } else {
        console.warn("Unknown condition type: " + typeof(condition));
      }
    })();
    return result;
  }


  /**
   * Resolve a type string, eg. '{id:number,items:Product[],category:{Indoor, Outdoor},tags:Array<string>}[]'
   * @param string type string
   * @param resolveUnknownObject function to resolve unknown types, like 'Product' in the example
   * @param originalString
   * @param cursor
   * @return {any}
   */
  public static resolveTypeString(string: string, resolveUnknownObject?: ((name: string, genericTypes: Schema[]) => Schema), originalString?: string, cursor: number = 0): Schema {
    if (!originalString) {
      originalString = string;
    }
    let input = string.trim();

    // Try resolve array
    const arrayMatch = input.match(REGEX_TYPE_ARRAY);
    if (arrayMatch && arrayMatch.length == 2) {
      const subSchema = SchemaHelper.resolveTypeString(arrayMatch[ 1 ], resolveUnknownObject, originalString, cursor + arrayMatch.index);
      return {
        type: SchemaTypes.ARRAY,
        items: subSchema
      }
    }

    // Try resolve object or enum
    const isObjectMatch = input.match(REGEX_TYPE_IS_OBJECT);
    if (isObjectMatch && isObjectMatch.length == 2) {
      const schema: Schema = {};
      const objContent = isObjectMatch[ 1 ];
      const regExp = new RegExp(REGEX_TYPE_OBJECT, 'g');
      let propMatch: RegExpExecArray;
      let additionalProperty: boolean = false;
      while (propMatch = regExp.exec(objContent)) {
        const key = propMatch[ 1 ];
        const value = propMatch[ 3 ];
        if (!value) {
          if (additionalProperty) {
            schema.additonalProperties = SchemaHelper.resolveTypeString(key, resolveUnknownObject, originalString, cursor + propMatch.index);
            additionalProperty = false;
          } else {
            if (schema.type && schema.type !== SchemaTypes.ENUM) {
              throw SchemaHelper.resolveTypeError("Expected key:value", propMatch[0], originalString, cursor + propMatch.index);
            }
            schema.type = SchemaTypes.ENUM;
            if (!schema.enum) {
              schema.enum = [];
            }
            schema.enum.push(key);
          }
        } else {
          if (additionalProperty) {
            throw SchemaHelper.resolveTypeError("Expected additionalProperty value", propMatch[0], originalString, cursor + propMatch.index);
          }
          if (schema.type && schema.type !== SchemaTypes.OBJECT) {
            throw SchemaHelper.resolveTypeError("Expected enum", propMatch[0], originalString, cursor + propMatch.index);
          }
          schema.type = SchemaTypes.OBJECT;
          if (key.indexOf('[') === 0 && value.lastIndexOf(']') === value.length - 1) {
            additionalProperty = true;
          } else {
            if (!schema.properties) {
              schema.properties = {};
            }
            schema.properties[key] = SchemaHelper.resolveTypeString(value, resolveUnknownObject, originalString, cursor + propMatch.index);
          }
        }
      }
      if (!schema.type) {
        schema.type = SchemaTypes.OBJECT;
        schema.properties = {};
      }
      return schema;
    }

    // Try resolve primitives
    if (input.match(REGEX_TYPE_PRIMITIVE_STRING)) {
      return {
        type: SchemaTypes.STRING
      };
    }
    if (input.match(REGEX_TYPE_PRIMITIVE_NUMBER)) {
      return {
        type: SchemaTypes.NUMBER
      };
    }
    if (input.match(REGEX_TYPE_PRIMITIVE_BOOLEAN)) {
      return {
        type: SchemaTypes.BOOLEAN
      };
    }
    if (input.match(REGEX_TYPE_PRIMITIVE_INTEGER)) {
      return {
        type: SchemaTypes.INTEGER
      };
    }
    if (input.match(REGEX_TYPE_PRIMITIVE_DATE)) {
      return {
        type: SchemaTypes.DATE
      };
    }
    if (input.match(REGEX_TYPE_PRIMITIVE_ANY)) {
      return {
        type: SchemaTypes.ANY
      };
    }

    // Try resolve reference type
    const genericTypes: Schema[] = [];
    const genericMatch = input.match(REGEX_TYPE_GENERIC);
    if (genericMatch && genericMatch.length == 3) {
      input = genericMatch[1].trim();
      const genericStrings = genericMatch[ 2 ];
      genericStrings.split(',').forEach(genericString => {
        genericTypes.push(SchemaHelper.resolveTypeString(genericString, resolveUnknownObject, originalString, cursor));
      });
    }

    if (input === 'Array') {
      let genericSchema: Schema;
      if (genericTypes.length >= 1) {
        genericSchema = genericTypes[0];
      } else {
        genericSchema = {
          type: SchemaTypes.ANY
        };
      }
      return {
        type: SchemaTypes.ARRAY,
        items: genericSchema
      }
    }

    if (input === 'Map') {
      let genericSchema: Schema;
      if (genericTypes.length >= 2) {
        genericSchema = genericTypes[1];
      } else {
        genericSchema = {
          type: SchemaTypes.ANY
        };
      }
      return {
        type: SchemaTypes.OBJECT,
        additonalProperties: genericSchema
      }
    }

    if (resolveUnknownObject) {
      return resolveUnknownObject(input, genericTypes);
    }

    throw SchemaHelper.resolveTypeError("Unknown type", string, originalString, cursor);
  }

  private static resolveTypeError(msg: string, match: string, originalString: string, cursor: number): Error {
    const trace = originalString.substr(0, cursor) + "-->" + originalString.substr(cursor);
    return new Error(msg + ": " + match + " in " + trace);
  }

}

const REGEX_TYPE_GENERIC = /^([^<]+)\<(.*?)\>$/;
const REGEX_TYPE_ARRAY = /^(.+)\[\]$/;
const REGEX_TYPE_IS_OBJECT = /^\{(.*)\}$/;
const REGEX_TYPE_OBJECT = "(?:(\\[?\\w+)|'(.+)')(?:\\s*:\\s*(?:([\\w]+\\]?)|(\\{.*\\}(?:\\[\\])?)))?\\s*,?";
const REGEX_TYPE_PRIMITIVE_STRING = /^string$/;
const REGEX_TYPE_PRIMITIVE_NUMBER = /^number$/;
const REGEX_TYPE_PRIMITIVE_BOOLEAN = /^bool(ean)?$/;
const REGEX_TYPE_PRIMITIVE_INTEGER = /^int(eger)?$/;
const REGEX_TYPE_PRIMITIVE_DATE = /^date$/;
const REGEX_TYPE_PRIMITIVE_ANY = /^any$/;
const REGEX_TYPE_REFERENCE_ARRAY = /^Array$/;
