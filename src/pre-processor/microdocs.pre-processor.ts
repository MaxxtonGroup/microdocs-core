import { Project, ProjectSettings } from "../domain";
import { SchemaHelper } from "../helpers/schema/schema.helper";
import { PreProcessor } from "./pre-processor";
import { Script, ScriptSelectorMatcher } from "./script.model";

const IF_PLACEHOLDER        = "~~~IF";
const COMMENT_PLACEHOLDER   = "~~~#";

/**
 * Helper for processing a document
 * @author Steven Hermans
 */
export class MicroDocsPreProcessor implements PreProcessor {

  /**
   * Check if the script should apply on the document
   * @param script script metadata
   * @param document document to check
   * @param env
   */
  public shouldApply( script: Script, document: Project, env: string ): boolean {
    if ( !document ) {
      return false;
    }
    if ( script.selectors ) {
      let selectors = script.selectors;
      if ( selectors.env && !this.matchSelector( env, selectors.env ) ) {
        return false;
      }
      if ( selectors.title || selectors.group || selectors.tag ) {
        if ( !document.info ) {
          return false;
        }
        let title = document.info.title;
        let group = document.info.group;
        let tag   = document.info.tag;

        if ( selectors.title && !this.matchSelector( title, selectors.title ) ) {
          return false;
        }
        if ( selectors.group && !this.matchSelector( group, selectors.title ) ) {
          return false;
        }
        if ( selectors.tag && !this.matchSelector( tag, selectors.title ) ) {
          return false;
        }
      }
      if ( selectors.fields ) {
        for ( let field in selectors.fields ) {
          let value = SchemaHelper.resolveReference( field, document );
          if ( !this.matchSelector( value, selectors.fields[ field ] ) ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if logical selector matches
   * @param value
   * @param matcher
   */
  private matchSelector( value: any, matcher: ScriptSelectorMatcher | string ): boolean {
    if ( typeof(matcher) === "string" && typeof(value) === "string" ) {
      let result = value.match( matcher );
      return !result && result.length > 0;
    } else if ( typeof(matcher) === "object" ) {
      // Exists operator
      if ( matcher.exists !== undefined ) {
        if ( !(value !== undefined && matcher.exists) ) {
          return false;
        }
      }
      // Not operator
      if ( matcher.not !== undefined ) {
        if ( !(!this.matchSelector( value, matcher.not )) ) {
          return false;
        }
      }
      // Matches operator
      if ( matcher.matches !== undefined ) {
        if ( !(this.matchSelector( value, matcher.matches )) ) {
          return false;
        }
      }
      // == operator
      if ( matcher[ '==' ] !== undefined ) {
        if ( !(value == matcher[ '==' ]) ) {
          return false;
        }
      }
      // != operator
      if ( matcher[ '!=' ] !== undefined ) {
        if ( !(value != matcher[ '==' ]) ) {
          return false;
        }
      }
      // >= operator
      if ( matcher[ '>=' ] !== undefined ) {
        if ( !(value >= matcher[ '>=' ]) ) {
          return false;
        }
      }
      // <= operator
      if ( matcher[ '<=' ] !== undefined ) {
        if ( !(value <= matcher[ '<=' ]) ) {
          return false;
        }
      }
      // AnyOf operator
      if ( matcher.anyOf !== undefined ) {
        let list    = matcher.anyOf;
        let matches = false;
        for ( let i = 0; i < list.length; i++ ) {
          let result = this.matchSelector( value, list[ i ] );
          if ( result ) {
            // Break at the first match
            matches = true;
            break;
          }
        }
        if ( !matches ) {
          return false;
        }
      }
      return true;
    } else {
      return value == matcher;
    }
  }

  /**
   * Process a script
   * @param script script to process
   * @param document document to apply it on
   * @param env
   */
  public processScript( script: Script, document: Project, env: string ): Project {
    let variables: any = {
      env: env
    };
    if ( document.info ) {
      variables.title = document.info.title;
      variables.tag   = document.info.tag;
      variables.group = document.info.group;
    }

    document = this.process( document, script.script, variables );


    return document;
  }

  /**
   * Resolve project with given settings
   * @param project
   * @param settings
   * @param projectScope
   * @param settingsScope
   * @param variables
   * @returns {any}
   */
  public process( project: Project, settings: any, variables: { scope?: {}, project?: {}, settings?: {}, settingsScope?: {}, [key: string]: any } = {}, projectScope?: any, settingsScope?: any, prevScope?: {} ): any {
    if ( settingsScope === undefined ) {
      settingsScope = settings;
    }
    if ( projectScope === undefined ) {
      projectScope = project;
    }
    if ( prevScope === undefined ) {
      prevScope = projectScope;
    }
    variables.project       = project;
    variables.scope         = projectScope;
    variables.settingsScope = settingsScope;
    variables.settings      = settings;

    if ( Array.isArray( settingsScope ) ) {
      if ( projectScope == null ) {
        projectScope = [];
      }
      if ( Array.isArray( projectScope ) ) {
        for ( var i = 0; i < settingsScope.length; i++ ) {
          projectScope.push( this.process( project, settings, variables, null, settingsScope[ i ] ) );
        }
      } else {
        console.warn( 'Could not process array when it is not one' );
      }
    } else if ( typeof(settingsScope) == "object" ) {
      if ( projectScope == null || typeof(projectScope) !== 'object' ) {
        projectScope = {};
      }
      for ( var key in settingsScope ) {
        var newSettingsScope = settingsScope[ key ];
        if ( !newSettingsScope ) {
          newSettingsScope = {};
        }
        if ( key === IF_PLACEHOLDER ) {
          let condition = newSettingsScope[ 'condition' ];
          if ( condition ) {
            let scopeVars = Object.assign( {}, variables, { settingsScope: settingsScope } );
            var result    = SchemaHelper.resolveCondition( condition, scopeVars );
            if ( result ) {
              if ( newSettingsScope[ 'then' ] ) {
                SchemaHelper.resolveCondition( newSettingsScope[ 'then' ], scopeVars );
              } else {
                console.warn( "No 'then' in ~~~IF statement" );
              }
            } else {
              if ( newSettingsScope[ 'else' ] ) {
                SchemaHelper.resolveCondition( newSettingsScope[ 'else' ], scopeVars );
              } else {
                console.warn( "No 'else' in ~~~IF statement" );
              }
            }
          } else {
            console.warn( 'No condition in ~~~IF statement' );
          }
        } else if ( key === COMMENT_PLACEHOLDER ) {
          continue;
        } else {
          var resolvedKey = SchemaHelper.resolveString( key, variables );
          if ( resolvedKey ) {
            if ( resolvedKey.indexOf( '{' ) == 0 && resolvedKey.indexOf( '}' ) == resolvedKey.length - 1 ) {
              var variableName = resolvedKey.substring( 1, resolvedKey.length - 1 );
              var oldVarValue  = variables[ variableName ];
              if ( Array.isArray( projectScope ) ) {
                let newProjectScopes: any[] = [];
                for ( let existingKey = 0; existingKey < projectScope.length; existingKey++ ) {
                  variables[ variableName ] = existingKey;
                  var newProjectScope       = projectScope[ existingKey ];
                  if ( !newProjectScope ) {
                    newProjectScope = null;
                  }

                  newProjectScope = this.process( project, settings, variables, newProjectScope, newSettingsScope, projectScope );
                  newProjectScopes.push( newProjectScope );

                  // clean up
                  if ( oldVarValue ) {
                    variables[ variableName ] = oldVarValue;
                  } else {
                    delete variables[ variableName ];
                  }
                }
                projectScope = newProjectScopes;
              } else {
                let newProjectScopes: any = {};
                for ( let existingKey in projectScope ) {
                  variables[ variableName ] = existingKey;
                  var newProjectScope       = projectScope[ existingKey ];
                  if ( !newProjectScope ) {
                    newProjectScope = null;
                  }

                  newProjectScope                 = this.process( project, settings, variables, newProjectScope, newSettingsScope, projectScope );
                  newProjectScopes[ existingKey ] = newProjectScope;

                  // clean up
                  if ( oldVarValue ) {
                    variables[ variableName ] = oldVarValue;
                  } else {
                    delete variables[ variableName ];
                  }
                }
                projectScope = newProjectScopes;
              }
            } else {
              if ( Array.isArray( projectScope ) ) {
                console.warn( "Could process array as object" );
              } else {
                var newProjectScope = projectScope[ resolvedKey ];
                if ( !newProjectScope ) {
                  newProjectScope = null;
                }

                newProjectScope = this.process( project, settings, variables, newProjectScope, newSettingsScope, projectScope );
                if ( newProjectScope != undefined ) {
                  projectScope[ resolvedKey ] = newProjectScope;
                }

                // clean up
//                if (oldVarValue) {
//                  variables[variableName] = oldVarValue;
//                } else {
//                  delete variables[variableName];
//                }
              }
            }
          } else {
            if ( Array.isArray( projectScope ) ) {
              console.warn( "Could process array as object" );
            } else {
              var newProjectScope = projectScope[ resolvedKey ];
              if ( !newProjectScope ) {
                newProjectScope = null;
              }
              newProjectScope = this.process( project, settings, variables, newProjectScope, newSettingsScope );
              if ( newProjectScope != undefined ) {
                projectScope[ resolvedKey ] = newProjectScope;
              }
            }
          }
        }
      }
    } else if ( typeof(settingsScope) === 'string' ) {
      let varCopy: { scope?: {}, project?: {}, settings?: {}, settingsScope?: {}, [key: string]: any } = {};
      for ( let key in variables ) {
        varCopy[ key ] = variables[ key ];
      }
      varCopy.scope     = prevScope;
      var resolvedValue = SchemaHelper.resolveString( settingsScope, varCopy );
      if ( resolvedValue != undefined ) {
        projectScope = resolvedValue;
      }
    } else {
      projectScope = settingsScope;
    }
    return projectScope;
  }


}