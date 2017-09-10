/**
 * Preprocess script metadata
 */
export interface Script {

  name?: string;
  description?: string;
  selectors?: ScriptSelectors
  script?: any;

}

export interface ScriptSelectors {

  title?: ScriptSelectorMatcher|string;
  group?: ScriptSelectorMatcher|string;
  env?: ScriptSelectorMatcher|string;
  tag?: ScriptSelectorMatcher|string;
  fields: {[field:string]:ScriptSelectorMatcher|string}

}

/**
 * Logical selectors
 */
export interface ScriptSelectorMatcher {
  exists?: boolean;
  matches?: string;
  '=='?: any;
  '!='?: any;
  '>='?: number;
  '<='?: number;
  not?: ScriptSelectorMatcher|string;
  anyOf?:Array<ScriptSelectorMatcher|string>;
}

const test = {
  name: "permissions script",
  selectors: {
    env: "develop",
    group: "mxts",
    fields: {
      "info.links": { anyOf: {'>=': true} }
    }
  },
  script: {}

}