import * as core from '@actions/core'
import { ActionInputs } from './action-inputs.js'

export async function getInputs(): Promise<ActionInputs> {
  const result = {} as unknown as ActionInputs

  const githubToken = core.getInput('token') || ''
  result.githubToken = githubToken

  const searchPath = core.getInput('path') || ''
  result.searchPath = searchPath

  const maxDepth = core.getInput('max_depth') || '0'
  result.maxDepth = parseInt(maxDepth)

  const patterns = core.getInput('patterns') || ''
  result.patterns = patterns.split('\n').filter((v) => v !== '')

  const includeDeletedFiles = core.getInput('include_deleted_files') || 'false'
  result.includeDeletedFiles = includeDeletedFiles === 'true'

  const includeOnlyDirectories =
    core.getInput('include_only_directories') || 'false'
  result.includeOnlyDirectories = includeOnlyDirectories === 'true'

  return result
}
