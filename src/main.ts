import * as github from '@actions/github'
import * as core from '@actions/core'
import * as path from 'path'
import mm from 'micromatch'

interface FileInfo {
  filename: string
  status?: string
}

function extractFolders(files: FileInfo[]): FileInfo[] {
  const folders = new Set<string>()
  const folderInfo: FileInfo[] = []

  files.forEach(file => {
    const dirPath = path.dirname(file.filename)
    if (dirPath !== '.' && !folders.has(dirPath)) {
      folders.add(dirPath)
      folderInfo.push({
        filename: dirPath,
        status: file.status
      })
    }
  })

  return folderInfo
}

async function getChangedFiles(
  octokit: ReturnType<typeof github.getOctokit>,
  includeDeletedFiles: boolean,
  includeOnlyFolders: boolean,
  searchPath: string,
  patterns: string[]
): Promise<string[]> {
  let files: FileInfo[] = []
  const changedFiles: string[] = []

  if (github.context.eventName === 'pull_request') {
    if (github.context.payload.pull_request) {
      const { data } = await octokit.rest.pulls.listFiles({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request.number
      })
      files = data
    }
  } else {
    const { data: commits } = await octokit.rest.repos.compareCommits({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      base: github.context.payload.before,
      head: github.context.payload.after
    })
    files = commits.files || []
  }

  if (searchPath !== "") {
    files = files
      .filter((file) => !path.relative(searchPath, file.filename).startsWith('..'))
      .map((file) => ({
        ...file,
        filename: path.relative(searchPath, file.filename)
      }))
  }

  if (!includeDeletedFiles) {
    files = files.filter((file) => file.status !== 'removed')
  }

  if (includeOnlyFolders) {
    files = extractFolders(files)
  }

  if (patterns.length > 0) {
    return mm(
      files.map((file) => file.filename),
      patterns
    )
  }

  files.map((file) => file.filename).forEach((file) => changedFiles.push(file))
  return changedFiles
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token')
    const searchPath = core.getInput('path')
    const patterns = core.getInput('patterns').split('\n').filter((v) => v !== '')
    const includeDeletedFiles =
      core.getInput('include_deleted_files') === 'true'
    const includeOnlyFolders =
      core.getInput('include_only_folders') === 'true'
    const octokit = github.getOctokit(githubToken)

    const changedFiles = await getChangedFiles(
      octokit,
      includeDeletedFiles,
      includeOnlyFolders,
      searchPath,
      patterns
    )

    console.log(`Changed ${includeOnlyFolders ? 'folders' : 'files'}${searchPath !== "" ? ` in ${searchPath}` : ""}:`)
    changedFiles.forEach((file) => console.log(`- ${file}`))

    // Set outputs for other workflow steps to use
    core.setOutput('changed_files', JSON.stringify(changedFiles))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
