#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const program = require('commander')
const chalk = require('chalk')
const { REPORTDEFAULTDIR, VUETEMPTSDIR } = require(path.join(
  __dirname,
  '../lib/constant'
))
const { mkDir, rmDir } = require(path.join(__dirname, '../lib/file'))
const { writeReport, writeDiagnosisReport } = require(path.join(
  __dirname,
  '../lib/report'
))
// 分析入口
const codeAnalysis = require(path.join(__dirname, '../lib/index'))

program
  .command('analysis')
  .description('分析代码并且输出报告')
  .action(async () => {
    try {
      const configPath = path.join(process.cwd(), './analysis.config.js')
      // 检测analysis.config.js文件是否存在
      let isConfig = fs.existsSync(configPath)
      if (isConfig) {
        let config = require(configPath)
        // 检查配置项是否正确
        if (
          config.scanSource &&
          Array.isArray(config.scanSource) &&
          config.scanSource.length
        ) {
          let isParamsError = false
          let isCodePathError = false
          let unExistDir = ''
          for (let i = 0; i < config.scanSource.length; i++) {
            if (
              !config.scanSource[i].name ||
              !config.scanSource[i].path ||
              !Array.isArray(config.scanSource[i].path) ||
              !config.scanSource[i].path.length
            ) {
              isParamsError = true
              break
            }
            let innerBreak = false
            const tempPathArr = config.scanSource[i].path
            for (let j = 0; j < tempPathArr.length; j++) {
              const tempPath = path.join(process.cwd(), tempPathArr[j])
              // 判断需要解析的文件目录是否存在
              if (!fs.existsSync(tempPath)) {
                isCodePathError = true
                unExistDir = tempPathArr[j]
                innerBreak = true
                break
              }
            }
            if (innerBreak) break
          }
          if (!isParamsError) {
            if (!isCodePathError) {
              if (config && config.analysisTarget) {
                try {
                  // 如果分析报告目录已经存在，则先删除目录
                  rmDir(config.reportDir || REPORTDEFAULTDIR)
                  // 如果temp目录已经存在，则先删除目录
                  rmDir(VUETEMPTSDIR)
                  // 如果需要扫描vue文件，创建temp目录
                  if (config.isScanVue) {
                    mkDir(VUETEMPTSDIR)
                  }
                  // 分析代码
                  const { report, diagnosisInfos } = await codeAnalysis(config)
                  // 输出分析报告
                  writeReport(config.reportDir || 'report', report)
                  // 输出诊断报告
                  writeDiagnosisReport(
                    config.reportDir || 'report',
                    diagnosisInfos
                  )
                  // 删除temp目录
                  rmDir(VUETEMPTSDIR)
                  // 代码告警/正常退出
                  if (
                    config.scorePlugin &&
                    config.alarmThreshold &&
                    typeof config.alarmThreshold === 'number' &&
                    config.alarmThreshold > 0
                  ) {
                    if (
                      report.scoreMap.score &&
                      report.scoreMap.score < config.alarmThreshold
                    ) {
                      // 输出代码分数信息
                      console.log(
                        chalk.red(
                          '\n' +
                            '代码得分：' +
                            report.scoreMap.score +
                            ', 不合格'
                        )
                      )
                      if (report.scoreMap.message.length > 0) {
                        // 输出代码建议信息
                        console.log(chalk.yellow('\n' + '优化建议：'))
                        report.scoreMap.message.forEach((element, index) => {
                          console.log(chalk.yellow(index + 1 + '. ' + element))
                        })
                      }
                      // 输出告警信息
                      console.log(chalk.red('\n' + '=== 触发告警 ===' + '\n'))
                      // 触发告警错误并结束进程
                      process.exit(1)
                    } else {
                      console.log(
                        chalk.green('\n' + '代码得分：' + report.scoreMap.score)
                      )
                      if (report.scoreMap.message.length > 0) {
                        // 输出代码建议信息
                        console.log(chalk.yellow('\n' + '优化建议：'))
                        report.scoreMap.message.forEach((element, index) => {
                          console.log(chalk.yellow(index + 1 + '. ' + element))
                        })
                      }
                    }
                  } else if (config.scorePlugin) {
                    // 输出代码分数信息
                    console.log(
                      chalk.green('\n' + '代码得分：' + report.scoreMap.score)
                    )
                    if (report.scoreMap.message.length > 0) {
                      // 输出代码建议信息
                      console.log(chalk.yellow('\n' + '优化建议：'))
                      report.scoreMap.message.forEach((element, index) => {
                        console.log(chalk.yellow(index + 1 + '. ' + element))
                      })
                    }
                  }
                } catch (error) {
                  // 删除temp目录
                  rmDir(VUETEMPTSDIR)
                  console.log(chalk.red(error.stack)) // 输出错误信息
                  process.exit(1) // 错误退出进程
                }
              } else {
                console.log(
                  chalk.red('error: 配置文件中缺少必填配置项analysisTarget')
                )
              }
            } else {
              console.log(
                chalk.red(`error: 配置文件中待分析文件目录${unExistDir}不存在`)
              )
            }
          } else {
            console.log(chalk.red('error: scanSource参数选项必填属性不能为空'))
          }
        } else {
          console.log(
            chalk.red('error: 配置文件中必填配置项scanSource不能为空')
          )
        }
      } else {
        console.log(chalk.red('error: 缺少analysis.config.js配置文件'))
      }
    } catch (error) {
      console.log(chalk.red(error.stack))
    }
  })

program.parse(process.argv)
