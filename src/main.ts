import * as github from '@actions/github'
import * as core from '@actions/core'
import mm from 'micromatch'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token')
    const patterns = core.getInput('patterns')
    const includeDeletedFiles =
      core.getInput('include_deleted_files') === 'true'
    const splitPatterns = patterns.split('\n').filter((v) => v !== '')
    const octokit = github.getOctokit(githubToken)

    let changedFiles: Array<string> = []
    const hasPatterns = splitPatterns.length > 0

    if (github.context.eventName === 'pull_request') {
      if (github.context.payload.pull_request) {
        let { data: files } = await octokit.rest.pulls.listFiles({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: github.context.payload.pull_request.number
        })
        if (!includeDeletedFiles) {
          files = files.filter((file) => file.status !== 'removed')
        }
        if (hasPatterns) {
          changedFiles = mm(
            files.map((file) => file.filename),
            splitPatterns
          )
        } else {
          files
            .map((file) => file.filename)
            .forEach((file) => changedFiles.push(file))
        }
      }
    } else {
      const { data: commits } = await octokit.rest.repos.compareCommits({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        base: github.context.payload.before,
        head: github.context.payload.after
      })
      let files = commits.files || []
      if (!includeDeletedFiles) {
        files = files.filter((file) => file.status !== 'removed')
      }
      if (hasPatterns) {
        changedFiles = mm(
          files.map((file) => file.filename),
          splitPatterns
        )
      } else {
        files
          ?.map((file) => file.filename)
          .forEach((file) => changedFiles.push(file))
      }
    }
    console.log('Changed files:')
    changedFiles.forEach((file) => console.log(`- ${file}`))

    // Set outputs for other workflow steps to use
    core.setOutput('changed_files', JSON.stringify(changedFiles))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
