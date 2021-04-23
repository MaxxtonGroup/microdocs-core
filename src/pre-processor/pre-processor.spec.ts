
// import { expect, assert } from 'chai';
import { Project } from "../domain/project.model";
import { MicroDocsPreProcessor } from "./microdocs.pre-processor";

describe( '#MicroDocsPreProcessor: ', () => {

  describe( "#process(): ", () => {

    test( "Test empty settings", () => {
      let project: Project = {} as Project;
      let settings        = {};

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( {} );
    } );

    test( "Test static settings", () => {
      let project: Project = {} as Project;
      let settings        = { test: true };

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( { test: true } );
    } );

    test( "Test static nested settings", () => {
      let project: Project = {} as Project;
      let settings        = { obj: { test: true } };

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( { obj: { test: true } } );
    } );

    test( "Test static merge settings", () => {
      let project: Project = { obj: 'lalala' } as Project;
      let settings        = { obj: { test: true } };

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( { obj: { test: true } } );
    } );

    test( "Test static array", () => {
      let project: Project = { array: [] } as Project;
      let settings        = { array: [ 'item', 'item' ] };

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( { array: [ 'item', 'item' ] } );
    } );

    test( "Test variable injection", () => {
      let project: Project = { myvar: 'helloWorld' } as Project;
      let settings        = { resolved: '$project.myvar' };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( { myvar: 'helloWorld', resolved: 'helloWorld' } );
    } );

    test( "Test missing variable injection", () => {
      let project: Project = { myvar: 'helloWorld' } as Project;
      let settings        = { resolved: '$myvar' };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( { myvar: 'helloWorld' } );
    } );

    test( "Test dynamic array", () => {
      let project: Project = { array: [ { name: 'john' }, { name: 'alice' } ] } as Project;
      let settings        = { array: { '{i}': { index: '$i' } } };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( { array: [ { name: 'john', index: 0 }, { name: 'alice', index: 1 } ] } );
    } );

    test( "Test dynamic object", () => {
      let project: Project = { object: { "john": { age: 15 }, 'alice': { age: 20 } } } as Project;
      let settings        = { object: { '{i}': { name: '$i' } } };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( {
        object: {
          "john": { age: 15, name: 'john' },
          'alice': { age: 20, name: 'alice' }
        }
      } );
    } );

    test( "Test IF statement", () => {
      let project: Project = {
        object: {
          "john": {
            age: 15,
            isOld: true
          },
          'alice': { age: 20 }
        }
      } as Project;
      let settings        = {
        object: {
          '{i}': {
            "~~~IF": {
              "condition": "scope.age < 18",
              "then": "scope.isOld = false",
              "else": "scope.isOld = true"
            }
          }
        }
      };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( {
        object: {
          "john": { age: 15, isOld: false },
          'alice': { age: 20, isOld: true }
        }
      } );
    } );

    test( "Test comment", () => {
      let project: Project = {
        object: {
          'hello': 'bye'
        }
      } as Project;
      let settings        = {
        object: {
          '~~~#': "Ignore me"
        }
      };

      let result = new MicroDocsPreProcessor().process( project, settings );

      expect( result ).toEqual( {
        object: {
          'hello': 'bye'
        }
      } );
    } );

    test( "Test scope", () => {
      let project: Project = {
        object: {
          "john": {
            age: 15
          },
          'alice': { age: 20 }
        }
      } as Project;
      let settings        = {
        object: {
          '{i}': {
            "description": "${i} is ${scope.age} years old"
          }
        }
      };

      let result = new MicroDocsPreProcessor().process( project, settings );
      expect( result ).toEqual( {
        object: {
          "john": { age: 15, description: "john is 15 years old" },
          'alice': { age: 20, description: "alice is 20 years old" }
        }
      } );
    } );

  } );

} );
