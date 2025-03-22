/**
 * Interface representing the inputs for the action
 */
export interface ActionInputs {
  /**
   * GitHub token for authentication
   */
  githubToken: string

  /**
   * Include deleted files in the results?
   */
  includeDeletedFiles: boolean

  /**
   * Include only directories in the results?
   */
  includeOnlyDirectories: boolean

  /**
   * Maximum directory depth
   */
  maxDepth: number

  /**
   * Glob patterns to match results against
   */
  patterns: string[]

  /**
   * Base path to start searching from
   */
  searchPath: string
}
