import { type FileInfo, FileInfoArray } from '../src/changes-helper'

describe('FileInfoArray', () => {
  describe('constructor', () => {
    it('should create empty array when no items provided', () => {
      const array = new FileInfoArray()
      expect(array).toHaveLength(0)
    })

    it('should initialize with provided items', () => {
      const items: FileInfo[] = [
        { filename: 'file1.txt' },
        { filename: 'file2.txt' }
      ]
      const array = new FileInfoArray(items)
      expect(array).toHaveLength(2)
      expect(array).toEqual(items)
    })
  })

  describe('filterByPath', () => {
    let array: FileInfoArray

    beforeEach(() => {
      array = new FileInfoArray([
        { filename: 'src/file1.txt' },
        { filename: 'src/nested/file2.txt' },
        { filename: 'test/file3.txt' }
      ])
    })

    it('should return all files when search path is empty', () => {
      const result = array.filterByPath('')
      expect(result).toHaveLength(3)
    })

    it('should filter files by search path', () => {
      const result = array.filterByPath('src')
      expect(result).toHaveLength(2)
      expect(result[0].filename).toBe('file1.txt')
      expect(result[1].filename).toBe('nested/file2.txt')
    })

    it('should exclude files outside search path', () => {
      const result = array.filterByPath('test')
      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('file3.txt')
    })
  })

  describe('filterStatus', () => {
    let array: FileInfoArray

    beforeEach(() => {
      array = new FileInfoArray([
        { filename: 'file1.txt', status: 'added' },
        { filename: 'file2.txt', status: 'removed' },
        { filename: 'file3.txt', status: 'modified' }
      ])
    })

    it('should filter out files with specified status', () => {
      const result = array.filterStatus('removed')
      expect(result).toHaveLength(2)
      expect(result.find((f) => f.status === 'removed')).toBeUndefined()
    })

    it('should keep files with different status', () => {
      const result = array.filterStatus('modified')
      expect(result).toHaveLength(2)
      expect(result.find((f) => f.status === 'modified')).toBeUndefined()
    })
  })

  describe('filterDirectories', () => {
    let array: FileInfoArray

    beforeEach(() => {
      array = new FileInfoArray([
        { filename: 'src/components/Button.tsx' },
        { filename: 'src/utils/helpers.ts' },
        { filename: 'tests/unit/test1.ts' }
      ])
    })

    it('should return full directory paths when maxDepth is 0', () => {
      const result = array.filterDirectories(0)
      expect(result).toHaveLength(3)
      expect(result.map((f) => f.filename)).toEqual([
        'src/components',
        'src/utils',
        'tests/unit'
      ])
    })

    it('should limit directory depth based on maxDepth', () => {
      const result = array.filterDirectories(1)
      expect(result).toHaveLength(2)
      expect(result.map((f) => f.filename)).toEqual(['src', 'tests'])
    })

    it('should handle files in root directory', () => {
      const rootArray = new FileInfoArray([
        { filename: 'root.txt' },
        { filename: 'src/file.txt' }
      ])
      const result = rootArray.filterDirectories(0)
      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('src')
    })
  })

  describe('filterPatterns', () => {
    let array: FileInfoArray

    beforeEach(() => {
      array = new FileInfoArray([
        { filename: 'src/file1.ts' },
        { filename: 'src/file2.js' },
        { filename: 'test/test1.ts' }
      ])
    })

    it('should filter files matching single pattern', () => {
      const result = array.filterPatterns(['**/*.ts'])
      expect(result).toHaveLength(2)
      expect(result.every((f) => f.filename.endsWith('.ts'))).toBe(true)
    })

    it('should filter files matching multiple patterns', () => {
      const result = array.filterPatterns(['src/**/*', '**/test*.ts'])
      expect(result).toHaveLength(3)
    })

    it('should return empty array when no files match pattern', () => {
      const result = array.filterPatterns(['**/*.php'])
      expect(result).toHaveLength(0)
    })
  })
})
