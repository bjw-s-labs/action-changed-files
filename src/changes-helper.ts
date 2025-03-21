import * as github from '@actions/github'
import * as path from 'path'
import mm from 'micromatch'

export interface FileInfo {
  filename: string
  status?: string
}

export class FileInfoArray extends Array<FileInfo> {
  constructor(items?: FileInfo[]) {
    super()
    if (items && Array.isArray(items)) {
      this.push(...items)
    }
  }

  filterByPath(searchPath: string): FileInfoArray {
    return this.filter(
      (file) => !path.relative(searchPath, file.filename).startsWith('..')
    ).map((file) => ({
      ...file,
      filename: path.relative(searchPath, file.filename)
    })) as FileInfoArray
  }

  filterStatus(status: string): FileInfoArray {
    return this.filter((file) => file.status !== status) as FileInfoArray
  }

  filterDirectories(maxDepth: number): FileInfoArray {
    const dirs: Set<string> = new Set()

    this.forEach((file) => {
      const dirPath = path.dirname(file.filename)
      const splitDirs = dirPath.split(path.sep).slice(0, maxDepth)
      if (dirPath !== '.') {
        if (maxDepth > 0) {
          dirs.add(splitDirs.join(path.sep))
        } else {
          dirs.add(dirPath)
        }
      }
    })

    const result = Array.from(dirs).map((dir) => ({
      filename: dir
    })) as FileInfo[]

    return new FileInfoArray(result)
  }

  filterPatterns(patterns: string[]): FileInfoArray {
    return this.filter((file) =>
      mm.isMatch(file.filename, patterns)
    ) as FileInfoArray
  }
}

export async function getFileChangesFromContext(
  octokit: ReturnType<typeof github.getOctokit>
): Promise<FileInfoArray> {
  if (github.context.eventName === 'pull_request') {
    if (github.context.payload.pull_request) {
      const { data } = await octokit.rest.pulls.listFiles({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request.number
      })
      return new FileInfoArray(data)
    }
  } else {
    const { data: commits } = await octokit.rest.repos.compareCommits({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      base: github.context.payload.before,
      head: github.context.payload.after
    })
    return new FileInfoArray(commits.files)
  }
  return new FileInfoArray()
}

export async function getChangedFiles(
  octokit: ReturnType<typeof github.getOctokit>,
  includeDeletedFiles: boolean,
  includeOnlyDirectories: boolean,
  searchPath: string,
  maxDepth: number,
  patterns: string[]
): Promise<string[]> {
  let files: FileInfoArray = await getFileChangesFromContext(octokit)
  const changedFiles: string[] = []

  // Limit the changed files to the ones in searchPath
  if (searchPath !== '') {
    files = files.filterByPath(searchPath)
  }

  // Filter out the removed files
  if (!includeDeletedFiles) {
    files = files.filterStatus('removed')
  }

  // Limit the result to be only the directories where the changed files are located
  if (includeOnlyDirectories) {
    files = files.filterDirectories(maxDepth)
  }

  // Apply user supplied filter patterns to the files/directories that were left
  if (patterns.length > 0) {
    files = files.filterPatterns(patterns)
  }

  files.map((file) => file.filename).forEach((file) => changedFiles.push(file))

  return changedFiles
}
