
/**
 * @author Steven Hermans
 */
export interface SchemaMappings{
  json?:SchemaMapping;
  relational?:SchemaMapping;
  client?:SchemaMapping;
}

export interface SchemaMapping{

  ignore?:boolean;
  name?:string;
  primary?:boolean;
  tables?:string[];
}