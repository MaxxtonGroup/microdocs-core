
export interface ProjectMetadata {

  title: string;
  env?: string;
  group?: string;
  latestTag?: string;
  tags?: {[name:string]:ProjectMetadataTag};
  documents?: string[];
  color?: string;
  searchTags?: string[];
  problems?: number;

}

export interface ProjectMetadataTag {

  id?:string;
  deprecated?:boolean;
  opaque?:boolean;
  updateTime?: string;

}