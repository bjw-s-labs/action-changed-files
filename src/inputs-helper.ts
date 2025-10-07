import * as core from '@actions/core'
import { ActionInputs } from './action-inputs.js'

export async function getInputs(): Promise<ActionInputs> {
  const result = {} as unknown as ActionInputs

  // Get required inputs
  const githubToken = core.getInput('token') || ''
  const searchPath = core.getInput('path') || ''
  const patterns = core.getInput('patterns') || ''

  // Parse numeric inputs
  const maxDepth = parseInt(core.getInput('max_depth') || '0', 10)

  // Parse boolean inputs
  const includeDeletedFiles = core.getInput('include_deleted_files') || 'false'
  const includeOnlyDirectories =
    core.getInput('include_only_directories') || 'false'

  // Assign to result object
  result.githubToken = githubToken
  result.searchPath = searchPath
  result.patterns = patterns.split('\n').filter((v) => v !== '')
  result.maxDepth = maxDepth
  result.includeDeletedFiles = includeDeletedFiles === 'true'
  result.includeOnlyDirectories = includeOnlyDirectories === 'true'

  return result
}
