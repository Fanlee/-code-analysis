/*
 * @Author: lihuan
 * @Date: 2023-04-18 14:56:09
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-18 15:01:04
 * @Description:
 */
const path = require('path')
const glob = require('glob')

// 扫描指定目录下面的 ts和tsx文件
exports.scanFileTs = (scanPath) => {
  const tsFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.ts`))
  const tsxFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.tsx`))
  return tsFiles.concat(tsxFiles)
}
