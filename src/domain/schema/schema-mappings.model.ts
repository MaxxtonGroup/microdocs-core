
/**
 * @author Steven Hermans
 */
export interface SchemaMappings{
  json?:SchemaMapping;
  relational?:SchemaMapping;
  downstreamCheck?:SchemaMapping;
}

export interface SchemaMapping{

  ignore?:boolean;
  name?:string;
  primary?:boolean;
  tables?:string[];
}