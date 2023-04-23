/*
 * @Author: lihuan
 * @Date: 2023-04-23 10:51:38
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-23 11:32:13
 * @Description:
 */
const fs = require('fs') // 文件操作
const path = require('path')
const { writeJsFile, writeJsonFile } = require(path.join(__dirname, './file'))
const {
  TEMPLATEDIR,
  REPORTFILENAME,
  REPORTJSPRE,
  DIAGNOSISREPORTFILENAME,
} = require(path.join(__dirname, './constant'))

//输出分析报告
exports.writeReport = (dir, content, templatePath = '') => {
  try {
    // 创建目录
    fs.mkdirSync(path.join(process.cwd(), `/${dir}`), 0o777)
    // 复制报告模版
    if (templatePath && templatePath !== '') {
      fs.writeFileSync(
        path.join(process.cwd(), `/${dir}/${REPORTFILENAME}.html`),
        fs.readFileSync(process.cwd(), `${templatePath}`)
      )
    } else {
      fs.writeFileSync(
        path.join(process.cwd(), `/${dir}/${REPORTFILENAME}.html`),
        fs.readFileSync(
          path.join(__dirname, `../${TEMPLATEDIR}/${REPORTFILENAME}.html`)
        )
      )
    }
    // 分析结果写入文件
    writeJsFile(REPORTJSPRE, content, `${dir}/${REPORTFILENAME}`)
    writeJsonFile(content, `${dir}/${REPORTFILENAME}`)
  } catch (error) {
    throw error
  }
}

// 输出诊断报告
exports.writeDiagnosisReport = (dir, content) => {
  try {
    writeJsonFile(content, `${dir}/${DIAGNOSISREPORTFILENAME}`)
  } catch (error) {
    throw error
  }
}
