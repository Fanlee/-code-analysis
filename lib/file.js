/*
 * @Author: lihuan
 * @Date: 2023-04-18 14:56:09
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-23 11:05:41
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

// 删除指定目录及目录下所有文件
exports.rmDir = (dirName) => {
  try {
    const dirPath = path.join(process.cwd(), `./${dirName}`)
    // 存在则删除
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath) // 返回文件和子目录的数组
      files.forEach((file) => {
        const curPath = path.join(dirPath, file)
        // 如果是文件夹则递归删除
        if (fs.statSync(curPath).isDirectory()) {
          rmDir(curPath)
        } else {
          // 文件则直接删除
          fs.unlinkSync(curPath)
        }
      })
      // 删除文件夹
      fs.rmdirSync(dirPath)
    }
  } catch (error) {
    throw error
  }
}

exports.mkDir = (dirName) => {
  try {
    // 0o777 设置文件模式(权限)
    fs.mkdirSync(path.join(process.cwd(), `/${dirName}`), 0o777)
  } catch (error) {
    throw error
  }
}

// 输出内容到JSON文件
exports.writeJsFile = (content, fileName) => {
  try {
    fs.writeFileSync(
      path.join(process.cwd(), `${fileName}.json`),
      JSON.stringify(content),
      'utf8'
    )
  } catch (error) {
    throw error
  }
}

// 输出内容到JS文件
exports.writeJsFile = (prc, content, fileName) => {
  try {
    fs.writeFileSync(
      path.join(process.cwd(), `${fileName}.js`),
      prc + JSON.stringify(content),
      'utf8'
    )
  } catch (e) {
    throw e
  }
}
