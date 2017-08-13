import { ProjectLink } from "./project-link.model";
import { ProjectInfo } from "./project-info.model";

export class ProjectInfoImpl implements ProjectInfo {

  public versions: string[];

  constructor( public title: string,
               public group: string,
               public version: string,
               versions: string[],
               public links ?: ProjectLink[],
               public description?: string,
               public sourceLink?: string,
               public publishTime?: string,
               public updateTime?: string,
               public color?: string,
               public postmanCollection?: string ) {
    this.setVersions(versions);
  }

  public getVersions(): string[] {
    return this.versions.sort();
  }

  setVersions( val: string[] ): void {
    this.versions = val;
  }

  /**
   * Get the ProjectInfo of different version
   * @param version the new version
   * @return {ProjectInfo,null} new ProjectInfo or null if the version doesn't exists
   */
  public getVersion( version: string ): ProjectInfoImpl {
    if (this.getVersions().filter(v => v == version).length == 0) {
      return null;
    }
    return new ProjectInfoImpl(this.title, this.group, version, this.getVersions());
  }

  /**
   * Get the previous version
   * @return {ProjectInfo,null} new ProjectInfo or null if the version doesn't exists
   */
  public getPrevVersion(): ProjectInfoImpl {
    var sortedVersions = this.getVersions().sort();
    var index = sortedVersions.indexOf(this.version);
    index--;
    if (index >= 0 && sortedVersions[index] != undefined) {
      return this.getVersion(sortedVersions[index]);
    }
    return null;
  }

  public toJson(): string {
    let output: any = {
      title: this.title,
      group: this.group,
      version: this.version,
      versions: this.getVersions(),
      description: this.description,
      links: this.links,
      sourceLink: this.sourceLink,
      publishTime: this.publishTime,
      updateTime: this.updateTime,
      color: this.color,
      postmanCollection: this.postmanCollection
    };
    return JSON.stringify(output);
  }

  public getLatestVersion(): ProjectInfoImpl {
    var sortedVersions = this.getVersions().sort();
    return this.getVersion(sortedVersions[sortedVersions.length - 1]);
  }

  public isLatestVersion(): boolean {
    return this.version === this.getLatestVersion().version;
  }
}