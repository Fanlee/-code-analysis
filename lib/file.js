/*
 * @Author: lihuan
 * @Date: 2023-04-18 14:56:09
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-20 16:33:15
 * @Description:
 */
const path = require('path')
const fs = require('fs')
const glob = require('glob')

// 扫描指定目录下面的 ts和tsx文件
exports.scanFileTs = (scanPath) => {
  const tsFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.ts`))
  const tsxFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.tsx`))
  return tsFiles.concat(tsxFiles)
}

// 扫描指定目录下面的vue文件
exports.scanFileVue = (scanPath) => {
  const entryFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.vue`))
  return entryFiles
}

// 读取文件内容
exports.getCode = (fileName) => {
  try {
    const code = fs.readFileSync(fileName, 'utf-8')
    return code
  } catch (error) {
    throw error
  }
}

// 写入内容到ts文件
exports.writeTsFile = (content, fileName) => {
  try {
    fs.writeFileSync(
      path.join(process.cwd(), `${fileName}.ts`),
      content,
      'utf-8'
    )
  } catch (error) {
    throw error
  }
}
