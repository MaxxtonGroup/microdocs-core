
import {SchemaHelper} from "./schema.helper";
import {SchemaTypes} from "../../domain";
import {Schema} from "../../domain/schema/schema.model";

describe('#SchemaHelper: ', () => {

  describe("#resolveString(): ", () => {

    test("test simple string", () => {
      const testString = "hello world";

      const result = SchemaHelper.extractStringSegments(testString);

      expect(result.length).toBe(1);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toBe(testString);
    });

    test("test empty string", () => {
      const testString = "";

      const result = SchemaHelper.extractStringSegments(testString);
      expect(result.length).toBe(0);
    });

    test("test simple var", () => {
      const testString = "hello $name sec";

      const result = SchemaHelper.extractStringSegments(testString);
      expect(result.length).toBe(3);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toEqual( "hello ");
      expect(result[1].isVar).toBeTruthy();
      expect(result[1].expression).toEqual( "name");
      expect(result[2].isVar).toBeFalsy();
      expect(result[2].expression).toEqual( " sec");
    });

    test("test bracket var", () => {
      const testString = "hello ${name test} sec";

      const result = SchemaHelper.extractStringSegments(testString);

      expect(result.length).toEqual( 3);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toEqual( "hello ");
      expect(result[1].isVar).toBeTruthy();
      expect(result[1].expression).toEqual( "name test");
      expect(result[2].isVar).toBeFalsy();
      expect(result[2].expression).toEqual( " sec");
    });

    test("test pipe", () => {
      const testString = "hello ${name test | number} sec";

      const result = SchemaHelper.extractStringSegments(testString);

      expect(result.length).toEqual( 3);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toEqual( "hello ");
      expect(result[1].isVar).toBeTruthy();
      expect(result[1].expression).toEqual( "name test");
      expect(result[1].pipes.length).toEqual( 1);
      expect(result[1].pipes[0]).toEqual( {name: "number"});
      expect(result[2].isVar).toBeFalsy();
      expect(result[2].expression).toEqual( " sec");
    });

    test("test pipe arg", () => {
      const testString = "hello ${name test | replace test hello} sec";

      const result = SchemaHelper.extractStringSegments(testString);

      expect(result.length).toEqual( 3);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toEqual( "hello ");
      expect(result[1].isVar).toBeTruthy();
      expect(result[1].expression).toEqual( "name test");
      expect(result[1].pipes.length).toEqual( 1);
      expect(result[1].pipes[0]).toEqual( {name: "replace", args: ['test', 'hello']});
      expect(result[2].isVar).toBeFalsy();
      expect(result[2].expression).toEqual( " sec");
    });

    test("test advanced expression", () => {
      const testString = "hello ${name test | replace test hello} sec $name2|number|json $name3 string ${name4}";

      const result = SchemaHelper.extractStringSegments(testString);

      expect(result.length).toEqual( 8);
      expect(result[0].isVar).toBeFalsy();
      expect(result[0].expression).toEqual( "hello ");

      expect(result[1].isVar).toBeTruthy();
      expect(result[1].expression).toEqual( "name test");
      expect(result[1].pipes.length).toEqual( 1);
      expect(result[1].pipes[0]).toEqual( {name: "replace", args: ['test', 'hello']});

      expect(result[2].isVar).toBeFalsy();
      expect(result[2].expression).toEqual( " sec ");

      expect(result[3].isVar).toBeTruthy();
      expect(result[3].expression).toEqual( "name2");
      expect(result[3].pipes.length).toEqual( 2);
      expect(result[3].pipes[0]).toEqual( {name: "number"});
      expect(result[3].pipes[1]).toEqual( {name: "json"});

      expect(result[4].isVar).toBeFalsy();
      expect(result[4].expression).toEqual( " ");

      expect(result[5].isVar).toBeTruthy();
      expect(result[5].expression).toEqual( "name3");

      expect(result[6].isVar).toBeFalsy();
      expect(result[6].expression).toEqual( " string ");

      expect(result[7].isVar).toBeTruthy();
      expect(result[7].expression).toEqual( "name4");
    });

  });

  describe("#collect(): ", () => {

    test("test collect inheritance", () => {
      const schema: Schema = {
        type: SchemaTypes.OBJECT,
        properties: {
          distributionChannelId: {
            type: SchemaTypes.INTEGER
          }
        },
        allOf: [{
          $ref: "#/ParentObject"
        }]
      } as Schema;

      const rootObject = {
        ParentObject: {
          type: SchemaTypes.OBJECT,
          properties: {
            parentId: {
              type: SchemaTypes.INTEGER
            }
          }
        }
      };

      const resolvedObject = SchemaHelper.collect(schema, [], rootObject);

      expect(resolvedObject.properties['distributionChannelId']).not.toBeUndefined();

      // todo: check if this actually should be undefined.
      expect(resolvedObject.properties['parentId']).toBeUndefined();

    });

  });

  describe("#resolveTypeString(): ", () => {

    test("test unknown type", () => {
      const input = "this doesnt exists";

      const func = () => SchemaHelper.resolveTypeString(input);
      expect(func).toThrow();
    });

    test("test type string", () => {
      const input = "string";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.STRING).toEqual(result.type);
    });

    test("test type number", () => {
      const input = "number";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.NUMBER).toEqual(result.type);
    });

    test("test type boolean", () => {
      const input = "boolean";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.BOOLEAN).toEqual(result.type);
    });

    test("test type bool", () => {
      const input = "bool";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.BOOLEAN).toEqual(result.type);
    });

    test("test type integer", () => {
      const input = "integer";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.INTEGER).toEqual(result.type);
    });

    test("test type int", () => {
      const input = "int";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.INTEGER).toEqual(result.type);
    });

    test("test type date", () => {
      const input = "date";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.DATE).toEqual( result.type);
    });

    test("test type any", () => {
      const input = "any";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.ANY).toEqual( result.type);
    });

    test("test type array", () => {
      const input = "string[]";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.ARRAY).toEqual( result.type);
      expect(SchemaTypes.STRING).toEqual( result.items.type);
    });

    test("test type array", () => {
      const input = "string[]";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.ARRAY).toEqual( result.type);
      expect(SchemaTypes.STRING).toEqual( result.items.type);
    });

    test("test type object no props", () => {
      const input = "{}";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.OBJECT).toEqual( result.type);
      expect({}).toEqual( result.properties);
    });

    test("test type object one props", () => {
      const input = "{test:string}";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.OBJECT).toEqual( result.type);
      expect({test: {type: SchemaTypes.STRING}}).toEqual( result.properties);
    });

    test("test type object three props", () => {
      const input = "{test:string, test2:number, test3:bool}";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.OBJECT).toEqual( result.type);
      expect({type: SchemaTypes.STRING}).toEqual( result.properties['test']);
      expect({type: SchemaTypes.NUMBER}).toEqual( result.properties['test2']);
      expect({type: SchemaTypes.BOOLEAN}).toEqual( result.properties['test3']);
    });

    test("test type enum", () => {
      const input = "{test, test1, test2}";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.ENUM).toEqual(result.type);
      expect(['test', 'test1', 'test2']).toEqual( result.enum);
    });

    test("test type custom type", () => {
      const input = "Person";
      const handler = (name: string) => {
        return {
          type: SchemaTypes.OBJECT,
          name: 'Person'
        };
      };

      const result = SchemaHelper.resolveTypeString(input, handler);

      expect(SchemaTypes.OBJECT).toEqual( result.type);
      expect('Person').toEqual( result.name);
    });

    test("test generic type", () => {
      const input = "Array<string>";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.ARRAY).toEqual( result.type);
      expect(SchemaTypes.STRING).toEqual( result.items.type);
    });

    test("test multi generic type", () => {
      const input = "Map<string, int>";

      const result = SchemaHelper.resolveTypeString(input);

      expect(SchemaTypes.OBJECT).toEqual( result.type);
      expect(SchemaTypes.INTEGER).toEqual( result.additonalProperties.type);
    });

    test("test additional property", () => {
      const input = "{[key:string]:Component}";

      const result = SchemaHelper.resolveTypeString(input, ( modelName, genericTypes ) => {
        expect('Component').toEqual(modelName);
        return {
          $ref: '#/definitions/' + modelName
        };
      });

      expect(SchemaTypes.OBJECT).toEqual(result.type);
      expect('#/definitions/Component').toEqual(result.additonalProperties.$ref);
    });

  });

  describe("#resolveCondition(): ", () => {

    test("Test true condition", () => {
      const vars = {
        scope: {value: 5},
        project: {},
        settings: {},
        settingsScope: {}
      };


      const result = SchemaHelper.resolveCondition("scope.value == 5", vars);

      expect(result);
    });

  });

  describe("#resolveCondition(): ", () => {

    test("Test false condition", () => {
      const vars = {
        scope: {value: 5},
        project: {},
        settings: {},
        settingsScope: {}
      };


      const result = SchemaHelper.resolveCondition("scope.value > 5", vars);
      expect(result).toBeFalsy();
    });

  });

});
