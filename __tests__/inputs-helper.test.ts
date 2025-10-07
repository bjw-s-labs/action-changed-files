import * as core from '../__fixtures__/core.js'
import type { ActionInputs } from '../src/action-inputs'
import { jest } from '@jest/globals'

jest.unstable_mockModule('@actions/core', () => core)

const { getInputs } = await import('../src/inputs-helper')

describe('input-helper tests', () => {
  beforeAll(() => {
    // Reset mocks before each test
    jest.resetAllMocks()
  })

  it('sets defaults', async () => {
    const settings: ActionInputs = await getInputs()
    expect(settings).toBeTruthy()
    expect(settings.githubToken).toBe('')
    expect(settings.searchPath).toBe('')
    expect(settings.maxDepth).toBe(0)
    expect(settings.patterns.length).toBe(0)
    expect(settings.includeDeletedFiles).toBe(false)
    expect(settings.includeOnlyDirectories).toBe(false)
  })

  it('can be configured', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'dummy-token'
        case 'path':
          return 'test'
        case 'max_depth':
          return '2'
        case 'patterns':
          return '*.yaml'
        case 'include_deleted_files':
          return 'true'
        case 'include_only_directories':
          return 'true'
        default:
          return ''
      }
    })

    const settings: ActionInputs = await getInputs()
    expect(settings).toBeTruthy()
    expect(settings.githubToken).toBe('dummy-token')
    expect(settings.searchPath).toBe('test')
    expect(settings.maxDepth).toBe(2)
    expect(settings.patterns.length).toBe(1)
    expect(settings.includeDeletedFiles).toBe(true)
    expect(settings.includeOnlyDirectories).toBe(true)
  })
})
