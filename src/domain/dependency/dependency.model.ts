import { Path } from "../path/path.model";
import { Component } from "../component/component.model";
import { DependencyImport } from "./dependency-import.model";

/**
 * @author Steven Hermans
 */
export interface Dependency {

  dependencyName?:string;
  description?:string;
  group?:string;
  tag?:string;
  latestTag?:string;
  deprecatedTags?:string[];
  type:string;
  protocol?:string;
  import?:DependencyImport;
  paths?:{[path:string]:{[method:string]:Path}};
  component?:Component;
  inherit?:boolean;

}