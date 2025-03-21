/**
 * Interface representing the inputs for the action
 */
export interface ActionInputs {
  /**
   * GitHub token for authentication
   */
  githubToken: string

  /**
   * Whether to include only deleted files in the results
   */
  includeDeletedFiles: boolean

  /**
   * Whether to include only directories in the result
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
