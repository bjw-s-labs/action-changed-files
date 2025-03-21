import * as github from '@actions/github'
import * as core from '@actions/core'

import * as inputHelper from './inputs-helper.js'
import { getChangedFiles } from './changes-helper.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const inputs = await inputHelper.getInputs()
    const octokit = github.getOctokit(inputs.githubToken)

    const changedFiles = await getChangedFiles(
      octokit,
      inputs.includeDeletedFiles,
      inputs.includeOnlyDirectories,
      inputs.searchPath,
      inputs.maxDepth,
      inputs.patterns
    )

    console.log('Changes:')
    changedFiles.forEach((file) => console.log(`  - ${file}`))

    core.setOutput('changed_files', JSON.stringify(changedFiles))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
