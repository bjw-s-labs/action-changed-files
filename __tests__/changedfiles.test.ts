import * as github from '@actions/github'
import { jest } from '@jest/globals'
import {
  FileInfo,
  getFileChangesFromContext,
  getChangedFiles
} from '../src/changes-helper.js'

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
let mockOctokit: any

beforeEach(() => {
  process.env.GITHUB_REPOSITORY = 'test-owner/test-repo'
})

describe('getFileChangesFromContext', () => {
  mockOctokit = {
    rest: {
      pulls: {
        listFiles: jest.fn()
      },
      repos: {
        compareCommits: jest.fn()
      }
    }
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fetch files for pull request event', async () => {
    // Mock GitHub context for pull request
    github.context.eventName = 'pull_request'
    github.context.payload = {
      pull_request: {
        number: 123
      }
    }
    const mockFiles = [
      { filename: 'file1.txt', status: 'added' },
      { filename: 'file2.txt', status: 'modified' }
    ]
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles })

    const result = await getFileChangesFromContext(mockOctokit)
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 123
    })
    expect(result).toEqual(mockFiles)
  })

  it('should fetch files for push event', async () => {
    // Mock GitHub context for push event
    github.context.eventName = 'push'
    github.context.payload = {
      before: 'before-sha',
      after: 'after-sha'
    }
    const mockFiles = [
      { filename: 'file1.txt', status: 'added' },
      { filename: 'file2.txt', status: 'modified' }
    ]
    mockOctokit.rest.repos.compareCommits.mockResolvedValue({
      data: { files: mockFiles }
    })

    const result = await getFileChangesFromContext(mockOctokit)

    expect(mockOctokit.rest.repos.compareCommits).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      base: 'before-sha',
      head: 'after-sha'
    })
    expect(result).toEqual(mockFiles)
  })

  it('should return empty array for pull request without payload', async () => {
    github.context.eventName = 'pull_request'
    github.context.payload = {}

    const result = await getFileChangesFromContext(mockOctokit)
    expect(result).toEqual([])
  })
})

describe('getChangedFiles', () => {
  let mockFiles: FileInfo[]

  beforeEach(() => {
    github.context.eventName = 'pull_request'
    github.context.payload = {
      pull_request: {
        number: 123
      }
    }
    mockFiles = [
      { filename: 'src/file1.ts', status: 'added' },
      { filename: 'src/nested/file2.ts', status: 'modified' },
      { filename: 'test/file3.ts', status: 'removed' },
      { filename: 'docs/readme.md', status: 'modified' }
    ]

    // Mock getFileChangesFromContext to return our test files
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return all files when no filters are applied', async () => {
    const files = await getChangedFiles(mockOctokit, true, false, '', 0, [])
    expect(files).toHaveLength(4)
    expect(files).toContain('src/file1.ts')
    expect(files).toContain('test/file3.ts')
  })

  it('should filter files by search path', async () => {
    const files = await getChangedFiles(mockOctokit, true, false, 'src', 0, [])
    expect(files).toHaveLength(2)
    expect(files).toContain('file1.ts')
    expect(files).toContain('nested/file2.ts')
  })

  it('should exclude deleted files when includeDeletedFiles is false', async () => {
    const files = await getChangedFiles(mockOctokit, false, false, '', 0, [])
    expect(files).toHaveLength(3)
    expect(files).not.toContain('test/file3.ts')
  })

  it('should return only directories with maxDepth 0', async () => {
    const files = await getChangedFiles(mockOctokit, true, true, '', 0, [])
    expect(files).toHaveLength(4)
    expect(files).toContain('src/nested')
    expect(files).toContain('src')
    expect(files).toContain('test')
    expect(files).toContain('docs')
  })

  it('should return directories with limited depth', async () => {
    const files = await getChangedFiles(mockOctokit, true, true, '', 1, [])
    expect(files).toHaveLength(3)
    expect(files).toContain('src')
    expect(files).toContain('test')
    expect(files).toContain('docs')
  })

  it('should filter files by patterns', async () => {
    const files = await getChangedFiles(mockOctokit, true, false, '', 0, [
      '**/*.ts'
    ])
    expect(files).toHaveLength(3)
    expect(files.every((f) => f.endsWith('.ts'))).toBe(true)
  })

  it('should combine all filters', async () => {
    const files = await getChangedFiles(
      mockOctokit,
      false, // exclude deleted
      true, // directories only
      'src', // search path
      1, // max depth
      ['**/nested'] // pattern
    )
    expect(files).toHaveLength(1)
    expect(files[0]).toBe('nested')
  })

  it('should handle empty results', async () => {
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: [] })
    const files = await getChangedFiles(mockOctokit, true, false, '', 0, [])
    expect(files).toHaveLength(0)
  })
})
