import { ProjectNode } from "./project-node.model";
/**
 * @author Steven Hermans
 */
export class FlatList extends Array<ProjectNode>{

  public addProject(projectNode:ProjectNode):void{
    let results = this.filter(node => node.title === projectNode.title && node.tag === projectNode.tag);
    if(results.length == 0){
      this.push(projectNode);
    }
  }

}