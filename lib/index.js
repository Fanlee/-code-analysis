/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:16:34
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 18:03:11
 * @Description:
 */
const path = require('path')
const moment = require('moment')
const ora = require('ora') // 命令行状态
const chalk = require('chalk')
const { REPORTTITLE, TIMEFORMAT } = require(path.join(__dirname, './constant'))
const CodeAnalysis = require(path.join(__dirname, './analysis'))
const config = require('../analysis.config')

const codeAnalysis = function (config) {
  return new Promise((resolve, reject) => {
    const spinner = ora(chalk.green('代码分析开始')).start()
    try {
      const coderTask = new CodeAnalysis(config)
      coderTask.analysis()
      // 打包分析结果
      const mapNames = coderTask.pluginsQueue
        .map((item) => item.mapName)
        .concat(coderTask.browserQueue.map((item) => item.mapName))
      const report = {
        importItemMap: coderTask.importItemMap,
        parseErrorInfos: coderTask.parseErrorInfos, // 解析异常信息
        scoreMap: coderTask.scoreMap, // 代码评分及建议信息
        reportTitle: config.reportTitle || REPORTTITLE,
        analysisTime: moment(Date.now()).format(TIMEFORMAT),
        mapNames: mapNames,
      }
      if (mapNames.length) {
        mapNames.forEach((item) => {
          report[item] = coderTask[item]
        })
      }
      // 返回分析结果
      resolve({ report, diagnosisInfos: coderTask.diagnosisInfos })
      spinner.succeed(chalk.green('代码分析完成'))
    } catch (error) {
      reject(error)
      spinner.fail(chalk.red('代码分析失败'))
    }
  })
}

;(async () => {
  await codeAnalysis(config)
})()

module.exports = codeAnalysis
