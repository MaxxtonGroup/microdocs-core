
export interface ProjectMetadata {

  title: string;
  group?: string;
  latestTag?: string;
  tags?: {[name:string]:ProjectMetadataTag};
  color?: string;

}

export interface ProjectMetadataTag {

  id?:string;
  deprecated?:boolean;
  opaque?:boolean;
  updateTime?: string;

}