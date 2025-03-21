import { jest } from '@jest/globals'

export const getChangedFiles =
  jest.fn<typeof import('../src/changes-helper.js').getChangedFiles>()
