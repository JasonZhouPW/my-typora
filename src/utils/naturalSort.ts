/**
 * 自然排序工具
 * 支持：
 * - 阿拉伯数字章节：第 1 章、第10章
 * - 中文数字章节：第一章、第十一章
 * - 多种单位：章、节、卷
 * - 回退到 localeCompare
 */

// 中文数字映射
const CHINESE_NUM_MAP: Record<string, number> = {
  '零': 0, '〇': 0,
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '百': 100, '千': 1000,
}

// 支持的单位
const UNITS = ['章', '节', '卷']

/**
 * 解析中文数字字符串为数值
 * 支持：一, 二, 十, 十一, 二十, 二十三, 一百零五 等
 */
function parseChineseNumber(numText: string): number | null {
  if (!numText || numText.length === 0) return null

  let result = 0
  let temp = 0

  for (const char of numText) {
    const val = CHINESE_NUM_MAP[char]
    if (val === undefined) return null

    if (val >= 10) {
      // 十、百、千 是乘数
      temp = temp === 0 ? val : temp * val
      result += temp
      temp = 0
    } else {
      // 0-9 累加
      temp = temp * 10 + val
    }
  }
  result += temp

  return result
}

/**
 * 解析章节信息
 * 支持格式：
 * - "第 1 章" (阿拉伯数字，有空格)
 * - "第1章" (阿拉伯数字，无空格)
 * - "第一章" (中文数字)
 * - "第 十一 节" (中文数字，有空格)
 */
interface ParsedSection {
  unit: string      // '章' | '节' | '卷'
  number: number   // 解析出的数字
  original: string // 原始匹配文本
}

function parseSection(name: string): ParsedSection | null {
  for (const unit of UNITS) {
    // 尝试匹配阿拉伯数字格式：第 X 章 / 第X章 / 第 X 章
    // 支持空格变体
    const arabicRegex = new RegExp(`第\\s*(\\d+)\\s*${unit}`)
    const arabicMatch = name.match(arabicRegex)
    if (arabicMatch) {
      return {
        unit,
        number: parseInt(arabicMatch[1], 10),
        original: arabicMatch[0],
      }
    }

    // 尝试匹配中文数字格式：第X章 / 第 X 章
    const chineseRegex = new RegExp(`第\\s*([零〇一二三四五六七八九十百千]+)\\s*${unit}`)
    const chineseMatch = name.match(chineseRegex)
    if (chineseMatch) {
      const num = parseChineseNumber(chineseMatch[1])
      if (num !== null) {
        return {
          unit,
          number: num,
          original: chineseMatch[0],
        }
      }
    }
  }

  return null
}

/**
 * 智能自然排序比较函数
 * 用于文件名排序，自动识别章节格式
 */
export function naturalCompare(a: string, b: string): number {
  const aSection = parseSection(a)
  const bSection = parseSection(b)

  // 两者都是章节格式
  if (aSection && bSection) {
    // 相同单位按数字排序
    if (aSection.unit === bSection.unit) {
      return aSection.number - bSection.number
    }
    // 不同单位按单位排序（章 < 节 < 卷）
    const unitOrder: Record<string, number> = { '章': 1, '节': 2, '卷': 3 }
    return (unitOrder[aSection.unit] || 99) - (unitOrder[bSection.unit] || 99)
  }

  // 只有一个是章节格式，章节优先
  if (aSection) return -1
  if (bSection) return 1

  // 都不是章节格式，使用 localeCompare 的 numeric 模式
  return a.localeCompare(b, 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  })
}

/**
 * 排序文件项数组
 */
export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => naturalCompare(a.name, b.name))
}

// 导出测试用的解析函数
export { parseSection, parseChineseNumber }