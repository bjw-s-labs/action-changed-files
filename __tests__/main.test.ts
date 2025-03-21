import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import { getChangedFiles } from '../__fixtures__/changes-helper.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('../src/changes-helper.js', () => ({
  getChangedFiles
}))

const { run } = await import('../src/main.js')

describe('run', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => '')

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should run successfully and log the changed files', async () => {
    const mockChangedFiles = ['file1.txt', 'file2.txt']

    getChangedFiles.mockImplementation(() => Promise.resolve(mockChangedFiles))
    await run()

    // Check if output is set
    expect(core.setOutput).toHaveBeenCalledWith(
      'changed_files',
      JSON.stringify(mockChangedFiles)
    )

    // Check logging
    expect(consoleLogSpy).toHaveBeenCalledWith('Changes:')
    mockChangedFiles.forEach((file) => {
      expect(consoleLogSpy).toHaveBeenCalledWith(`  - ${file}`)
    })

    // Check if no failure occurred
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('should handle errors and set the workflow as failed', async () => {
    // Mock that getChangedFiles throws an error
    const errorMessage = 'Something went wrong'
    getChangedFiles.mockRejectedValue(new Error(errorMessage))

    await run()

    // Check if no failure occurred
    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)

    // Check if output is not set
    expect(core.setOutput).not.toHaveBeenCalled()
  })
})
