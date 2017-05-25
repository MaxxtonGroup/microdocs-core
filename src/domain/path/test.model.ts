/**
 * Postman Test
 */
export interface Test{

  /**
   * Can be set to `test` or `prerequest` for test scripts or pre-request scripts respectively.
   */
  listen?:string;
  script?:string;

}