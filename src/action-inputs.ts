export interface ActionInputs {
  githubToken: string
  searchPath: string
  maxDepth: number
  patterns: string[]
  includeDeletedFiles: boolean
  includeOnlyDirectories: boolean
}
