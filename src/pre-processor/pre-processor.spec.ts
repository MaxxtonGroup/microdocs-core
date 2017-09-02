import { assert, expect } from "chai";
import { Project } from "../domain/project.model";
import { MicroDocsPreProcessor } from "./microdocs.pre-processor";

describe("#MicroDocsPreProcessor: ", () => {

  describe("#process(): ", () => {

    it("Test empty settings", () => {
      const project: Project = {};
      const settings = {};

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({});
    });

    it("Test static settings", () => {
      const project: Project = {};
      const settings = { test: true };

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({ test: true });
    });

    it("Test static nested settings", () => {
      const project: Project = {};
      const settings = { obj: { test: true } };

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({ obj: { test: true } });
    });

    it("Test static merge settings", () => {
      const project: Project = { obj: "lalala" };
      const settings = { obj: { test: true } };

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({ obj: { test: true } });
    });

    it("Test static array", () => {
      const project: Project = { array: [] };
      const settings = { array: ["item", "item"] };

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({ array: ["item", "item"] });
    });

    it("Test constiable injection", () => {
      const project: Project = { myconst: "helloWorld" };
      const settings = { resolved: "$project.myconst" };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({ myconst: "helloWorld", resolved: "helloWorld" });
    });

    it("Test missing constiable injection", () => {
      const project: Project = { myconst: "helloWorld" };
      const settings = { resolved: "$myconst" };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({ myconst: "helloWorld" });
    });

    it("Test dynamic array", () => {
      const project: Project = { array: [{ name: "john" }, { name: "alice" }] };
      const settings = { array: { "{i}": { index: "$i" } } };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({ array: [{ name: "john", index: 0 }, { name: "alice", index: 1 }] });
    });

    it("Test dynamic object", () => {
      const project: Project = { object: { john: { age: 15 }, alice: { age: 20 } } };
      const settings = { object: { "{i}": { name: "$i" } } };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({
        object: {
          john: { age: 15, name: "john" },
          alice: { age: 20, name: "alice" }
        }
      });
    });

    it("Test IF statement", () => {
      const project: Project = {
        object: {
          john: {
            age: 15,
            isOld: true
          },
          alice: { age: 20 }
        }
      };
      const settings = {
        object: {
          "{i}": {
            "~~~IF": {
              condition: "scope.age < 18",
              then: "scope.isOld = false",
              else: "scope.isOld = true"
            }
          }
        }
      };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({
        object: {
          john: { age: 15, isOld: false },
          alice: { age: 20, isOld: true }
        }
      });
    });

    it("Test comment", () => {
      const project: Project = {
        object: {
          hello: "bye"
        }
      };
      const settings = {
        object: {
          "~~~#": "Ignore me"
        }
      };

      const result = new MicroDocsPreProcessor().process(project, settings);

      expect(result).to.deep.eq({
        object: {
          hello: "bye"
        }
      });
    });

    it("Test scope", () => {
      const project: Project = {
        object: {
          john: {
            age: 15
          },
          alice: { age: 20 }
        }
      };
      const settings = {
        object: {
          "{i}": {
            description: "${i} is ${scope.age} years old"
          }
        }
      };

      const result = new MicroDocsPreProcessor().process(project, settings);
      expect(result).to.deep.eq({
        object: {
          john: { age: 15, description: "john is 15 years old" },
          alice: { age: 20, description: "alice is 20 years old" }
        }
      });
    });

  });

});