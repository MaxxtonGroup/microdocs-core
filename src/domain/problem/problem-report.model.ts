
import { Project } from "../project.model";
import { Component } from "../component/component.model";
import { Method } from "../component/method.model";

export class ProblemReport {

  private problems: Problem[];

  public getProblems():Problem[] {
    return this.problems;
  }

  /**
   * Add all problems of a nested report
   * @param problemReport
   */
  public addAll(problemReport:ProblemReport){
    problemReport.getProblems().forEach(problem => {
      this.problems.push(problem);
    });
  }

  /**
   * Add problem
   * @param problemOptions
   */
  public add( problemOptions: ProblemOptions ): void {
    let problem: Problem = {
      level: problemOptions.level,
      message: problemOptions.message,
      hint: problemOptions.hint
    };
    if ( problemOptions.source && problemOptions.source.info ) {
      problem.source = {
        title: problemOptions.source.info.title,
        id: problemOptions.source.id,
        tag: problemOptions.source.info.tag,
        path: problemOptions.sourcePath
      };
      if ( problemOptions.sourceClass ) {
        problem.source.className = problemOptions.sourceClass.name;
        problem.source.file      = problemOptions.sourceClass.file;
      }
      if ( problemOptions.sourceMethod ) {
        problem.source.lineNumber = problemOptions.sourceMethod.lineNumber;
      }
    }
    if ( problemOptions.target && problemOptions.target.info ) {
      problem.target = {
        title: problemOptions.target.info.title,
        id: problemOptions.target.id,
        tag: problemOptions.target.info.tag,
        path: problemOptions.targetPath
      };
      if ( problemOptions.targetClass ) {
        problem.target.className = problemOptions.targetClass.name;
        problem.target.file      = problemOptions.targetClass.file;
      }
      if ( problemOptions.targetMethod ) {
        problem.target.lineNumber = problemOptions.targetMethod.lineNumber;
      }
    }
    this.problems.push( problem );
  }

  /**
   * Reverse source and target for all problems
   */
  public reverse():void {
    this.problems.forEach(problem => {
      let source = problem.source;
      let target = problem.target;
      problem.source = target;
      problem.target = source;
    });
  }

  /**
   * Check if there are compatibility issues
   * @param {boolean} strict when false incompatible is errors only, when true incompatible is errors and warnings
   * @return {boolean} incompatible or not
   */
  public isCompatible(strict:boolean):boolean{
    return this.problems.filter(problem => strict ? (problem.level === Level.Error || problem.level === Level.Warning) : problem.level === Level.Error).length === 0;
  }

  /**
   * Get the problems with level Error
   * @return {Problem[]}
   */
  public getErrors():Problem[] {
    return this.problems.filter(problem => problem.level === Level.Error);
  }

  /**
   * Get the problems with level Warning
   * @return {Problem[]}
   */
  public getWarnings():Problem[] {
    return this.problems.filter(problem => problem.level === Level.Warning);
  }

  /**
   * Get the problems with level Info
   * @return {Problem[]}
   */
  public getinfos():Problem[] {
    return this.problems.filter(problem => problem.level === Level.Info);
  }

}

export interface ProblemOptions {

  level?: Level;
  message?: string;
  hint?: string;
  /** Location in the document */
  sourcePath?: string;
  targetPath?: string;
  source?: Project;
  target?: Project;
  sourceClass?: Component;
  sourceMethod?: Method;
  targetClass?: Component;
  targetMethod?: Method;

}

export interface Problem {

  level?: Level;
  message?: string;
  hint?: string;
  source?: ProblemComponent;
  target?: ProblemComponent;

}

export interface ProblemComponent {

  title?: string,
  id?: string,
  tag?: string;
  file?: string;
  lineNumber?: number;
  className?: string;
  /** Location in the document */
  path?: string;

}

export enum Level {
  Error   = "Error",
  Warning = "Warning",
  Info    = "Info",
}