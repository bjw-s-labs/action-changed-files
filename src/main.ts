import * as github from '@actions/github'
import * as core from '@actions/core'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token')
    const matchers = core.getInput('matchers')
    const splitMatchers = matchers.split('\n')
    const octokit = github.getOctokit(githubToken)

    const changedFiles: Array<string> = []

    if (github.context.eventName === 'pull_request') {
      if (github.context.payload.pull_request) {
        const { data: files } = await octokit.rest.pulls.listFiles({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: github.context.payload.pull_request.number
        })
        files
          .map((file) => file.filename)
          .forEach((file) => {
            if (splitMatchers.some((matcher) => file.match(matcher))) {
              changedFiles.push(file)
            }
          })
      }
    } else {
      const { data: commits } = await octokit.rest.repos.compareCommits({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        base: github.context.payload.before,
        head: github.context.payload.after
      })
      commits.files
        ?.map((file) => file.filename)
        .forEach((file) => {
          if (splitMatchers.some((matcher) => file.match(matcher))) {
            changedFiles.push(file)
          }
        })
    }
    console.log('Changed files:')
    changedFiles.forEach((file) => console.log(`- ${file}`))

    // Set outputs for other workflow steps to use
    core.setOutput('changed_files', changedFiles)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
