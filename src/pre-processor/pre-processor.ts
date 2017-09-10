import { Project } from "../domain/project.model";
import { ProjectSettings } from "../domain/settings/project-settings.model";
import { Script } from "./script.model";
/**
 * @author Steven Hermans
 */
export interface PreProcessor {

  /**
   * Check if the script should apply on the document
   * @param script script metadata
   * @param document document to check
   * @param env
   */
  shouldApply( script: Script, document: Project, env: string ): boolean;

  /**
   * Process a script
   * @param script script to process
   * @param document document to apply it on
   * @param env
   */
  processScript( script: any, document: Project, env: string ): Project;

}