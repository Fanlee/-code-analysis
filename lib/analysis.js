/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:28:51
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-23 13:50:14
 * @Description:
 */

const path = require('path')
const chalk = require('chalk') // 美化输出
const processLog = require('single-line-log') // 单行输出
const tsCompiler = require('typescript')
const { scanFileTs, scanFileVue } = require(path.join(__dirname, './file'))
const { parseTs, parseVue } = require(path.join(__dirname, './parse'))
const { CODEFILETYPE } = require(path.join(__dirname, './constant'))
const { defaultPlugin } = require(path.join(
  __dirname,
  '../plugins/defaultPlugin'
))
const { methodPlugin } = require(path.join(
  __dirname,
  '../plugins/methodPlugin'
))
const { typePlugin } = require(path.join(__dirname, '../plugins/typePlugin'))
const { browserPlugin } = require(path.join(
  __dirname,
  '../plugins/browserPlugin'
))
const { defaultScorePlugin } = require(path.join(__dirname, './score'))

class CodeAnalysis {
  constructor(options) {
    // 私有属性
    this._scanSource = options.scanSource //扫描源配置信息
    this._analysisTarget = options.analysisTarget // 要分析的依赖名
    this._blackList = options.blackList || [] // 需要标记的黑名单api
    this._browserApis = options.browserApis || [] // 需要分析的BrowserApi配置
    this._analysisPlugins = options.analysisPlugins || [] // 代码分析插件配置
    this._isScanVue = options.isScanVue || false // 是否扫描Vue配置
    this._scorePlugin = options.scorePlugin || null // 代码评分插件配置
    // 公共属性
    this.importItemMap = {} // importItem统计Map
    this.pluginsQueue = [] //插件队列
    this.diagnosisInfos = [] // 诊断日志信息
    this.parseErrorInfos = [] // 解析异常信息
    this.browserQueue = [] // Browser分析插件队列
    this.scoreMap = {} // 评分及建议Map
  }

  // 注册插件
  _installPlugins(plugins) {
    if (plugins.length) {
      plugins.forEach((item) => {
        this.pluginsQueue.push(item(this))
      })
    }
    // 内置的插件
    this.pluginsQueue.push(methodPlugin(this))
    this.pluginsQueue.push(typePlugin(this))
    this.pluginsQueue.push(defaultPlugin(this))
    if (this._browserApis.length) {
      this.browserQueue.push(browserPlugin(this))
    }
  }
  // 执行Target分析插件队列中的checkFun函数
  _runAnalysisPlugins(
    tsCompiler,
    baseNode,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    if (this.pluginsQueue.length) {
      for (let i = 0; i < this.pluginsQueue.length; i++) {
        const checkFun = this.pluginsQueue[i].checkFun
        if (
          checkFun(
            this,
            tsCompiler,
            baseNode,
            depth,
            apiName,
            matchImportItem,
            filePath,
            projectName,
            httpRepo,
            line
          )
        ) {
          break
        }
      }
    }
  }

  // 执行分析插件队列中的afterHook函数
  _runAnalysisPluginsHook() {
    if (this.pluginsQueue.length) {
      for (let i = 0; i < this.pluginsQueue.length; i++) {
        const afterHook = this.pluginsQueue[i].afterHook
        if (afterHook && typeof afterHook === 'function') {
          afterHook(
            this,
            this.pluginsQueue[i].mapName,
            importItems,
            ast,
            checker,
            filePath,
            projectName,
            httpRepo,
            baseLine
          )
        }
      }
    }
  }

  // 执行Browser分析插件队列中的检测函数
  _runBrowserPlugins(
    tsCompiler,
    baseNode,
    depth,
    apiName,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    if (this.browserQueue.length) {
      for (let i = 0; i < this.browserQueue.length; i++) {
        const checkFun = this.browserQueue[i].checkFun
        if (
          checkFun(
            this,
            tsCompiler,
            baseNode,
            depth,
            apiName,
            filePath,
            projectName,
            httpRepo,
            line
          )
        ) {
          break
        }
      }
    }
  }
  // API黑名单标记
  _blackTag(queue) {
    if (queue.length) {
      queue.forEach((item) => {
        Object.keys(this[item.mapName]).forEach((apiName) => {
          if (this._blackList.length && this._blackList.includes(apiName)) {
            this[item.mapName][apiName].isBlack = true
          }
        })
      })
    }
  }
  // 记录诊断日志
  addDiagnosisInfo(info) {
    this.diagnosisInfos.push(info)
  }

  // 分析import导入 (从上外下的模式进行分析)
  _findImportItems(ast, filePath, baseLine = 0) {
    let importItems = {}
    let that = this

    function dealImports(temp) {
      importItems[temp.name] = {}
      importItems[temp.name].origin = temp.origin
      importItems[temp.name].symbolPos = temp.symbolPos
      importItems[temp.name].symbolEnd = temp.symbolEnd
      importItems[temp.name].identifierPos = temp.identifierPos
      importItems[temp.name].identifierEnd = temp.identifierEnd
      if (!that.importItemMap[temp.name]) {
        that.importItemMap[temp.name] = {}
        that.importItemMap[temp.name].callOrigin = temp.origin
        that.importItemMap[temp.name].callFiles = []
        that.importItemMap[temp.name].callFiles.push(filePath)
      } else {
        that.importItemMap[temp.name].callFiles.push(filePath)
      }
    }

    // 遍历AST节点
    function walk(node) {
      tsCompiler.forEachChild(node, walk)
      const line =
        ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1
      if (tsCompiler.isImportDeclaration(node)) {
        // 过滤掉其他导入干扰项
        if (
          node.moduleSpecifier &&
          node.moduleSpecifier.text &&
          node.moduleSpecifier.text === that._analysisTarget
        ) {
          // 存在导入项
          if (node.importClause) {
            // 命中默认导入 如: import api from 'framework'
            if (node.importClause.name) {
              let temp = {
                name: node.importClause.name.escapedText, // 导入后在代码中真实调用使用的 API 名
                origin: null, // API 别名。null则表示该非别名导入，name就是原本名字
                symbolPos: node.importClause.pos, // symbol指向的声明节点在代码字符串中的起始位置
                symbolEnd: node.importClause.end, // symbol指向的声明节点在代码字符串中的结束位置
                identifierPos: node.importClause.name.pos, // API 名字信息节点在代码字符串中的起始位置
                identifierEnd: node.importClause.name.end, // API 名字信息节点在代码字符串中的结束位置
                line, // 导入 API 的import语句所在代码行信息
              }
              dealImports(temp)
            }
          }
          if (node.importClause.namedBindings) {
            // 命中扩展引入情况  如：
            // import { environment } from 'framework';
            // import { request as req } from 'framework';
            if (tsCompiler.isNamedImports(node.importClause.namedBindings)) {
              if (
                node.importClause.namedBindings.elements &&
                node.importClause.namedBindings.elements.length
              ) {
                const tempArr = node.importClause.namedBindings.elements
                tempArr.forEach((item) => {
                  if (tsCompiler.isImportSpecifier(item)) {
                    let temp = {
                      name: item.name.escapedText,
                      origin: item.propertyName
                        ? item.propertyName.escapedText
                        : null,
                      symbolPos: item.pos,
                      symbolEnd: item.end,
                      identifierPos: item.name.pos,
                      identifierEnd: item.name.end,
                      line,
                    }
                    dealImports(temp)
                  }
                })
              }
            }
            // 命中全局as的情况 import * as APP from 'framework';
            if (
              tsCompiler.isNamespaceImport(node.importClause.namedBindings) &&
              node.importClause.namedBindings.name
            ) {
              let temp = {
                name: node.importClause.namedBindings.name.escapedText,
                origin: '*',
                symbolPos: node.importClause.namedBindings.pos,
                symbolEnd: node.importClause.namedBindings.end,
                identifierPos: node.importClause.namedBindings.name.pos,
                identifierEnd: node.importClause.namedBindings.name.end,
                line: line,
              }
              dealImports(temp)
            }
          }
        }
      }
    }
    walk(ast)
    return importItems
  }

  // 分析ast节点（从下往上的模式进行分析）
  _dealAST(
    importItems,
    ast,
    checker,
    filePath,
    projectName,
    httpRepo,
    baseLine = 0
  ) {
    const that = this
    const importItemNames = Object.keys(importItems)

    // 遍历AST
    function walk(node) {
      tsCompiler.forEachChild(node, walk)
      const line =
        ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1

      // 判断当前节点是否与Import导入的api节点存在同名的情况
      if (
        tsCompiler.isIdentifier(node) &&
        node.escapedText &&
        importItemNames.length &&
        importItemNames.includes(node.escapedText)
      ) {
        const matchImportItem = importItems[node.escapedText]
        // 先排除Import自身
        if (
          node.pos !== matchImportItem.identifierPos &&
          node.end !== matchImportItem.identifierEnd
        ) {
          const symbol = checker.getSymbolAtLocation(node)
          // 存在声明
          if (symbol && symbol.declarations && symbol.declarations.length) {
            const nodeSymbol = symbol.declarations[0]
            // 上下文与import导入的匹配，符合API调用
            if (
              nodeSymbol.pos === matchImportItem.symbolPos &&
              nodeSymbol.end === matchImportItem.symbolEnd
            ) {
              if (node.parent) {
                const { baseNode, depth, apiName } =
                  that._checkPropertyAccess(node)
                // 执行分析插件
                that._runAnalysisPlugins(
                  tsCompiler,
                  baseNode,
                  depth,
                  apiName,
                  matchImportItem,
                  filePath,
                  projectName,
                  httpRepo,
                  line
                )
              }
            }
          }
        }
      }
      // browser解析
      if (
        tsCompiler.isIdentifier(node) &&
        node.escapedText &&
        that._browserApis.length &&
        that._browserApis.includes(node.escapedText)
      ) {
        const symbol = checker.getSymbolAtLocation(node)
        if (symbol && symbol.declarations) {
          if (
            symbol.declarations.length > 1 ||
            (symbol.declarations.length === 1 &&
              symbol.declarations[0].pos > ast.end)
          ) {
            const { baseNode, depth, apiName } = that._checkPropertyAccess(node)
            // 排除作为属性的场景
            if (
              !(
                depth > 0 &&
                node.parent.name &&
                node.parent.name.pos == node.pos &&
                node.parent.name.end == node.end
              )
            ) {
              that._runBrowserPlugins(
                tsCompiler,
                baseNode,
                depth,
                apiName,
                filePath,
                projectName,
                httpRepo,
                line
              )
            }
          }
        }
      }
    }
    walk(ast)
    // 执行afterhook
    this._runAnalysisPluginsHook(
      importItems,
      ast,
      checker,
      filePath,
      projectName,
      httpRepo,
      baseLine
    )
  }

  // 链式调用检查，找出链路最顶端node
  _checkPropertyAccess(node, index = 0, apiName = '') {
    if (index > 0) {
      apiName = apiName + '.' + node.name.escapedText
    } else {
      apiName = apiName + node.escapedText
    }
    if (tsCompiler.isPropertyAccessExpression(node.parent)) {
      index++
      return this._checkPropertyAccess(node.parent, index, apiName)
    } else {
      return {
        apiName,
        baseNode: node,
        depth: index,
      }
    }
  }

  // 扫描文件
  _scanFiles(scanSource, type) {
    let entrys = []
    scanSource.forEach((item) => {
      const entryObj = {
        name: item.name,
        httpRepo: item.httpRepo,
      }
      let parse = []
      let show = []
      const scanPath = item.path
      scanPath.forEach((sitem) => {
        let tempEntry = []
        if (type === CODEFILETYPE.VUE) {
          tempEntry = scanFileVue(sitem)
        } else if (type === CODEFILETYPE.TS) {
          tempEntry = scanFileTs(sitem)
        }
        let tempPath = tempEntry.map((titem) => {
          // 将E:/workspace/code-analysis/src/test.ts格式处理成src/test.ts格式
          const s = titem.substring(titem.indexOf(sitem))
          // 执行文件路径格式化函数
          if (item.format && typeof item.format === 'function') {
            return item.format(s)
          } else {
            return s
          }
        })
        parse = parse.concat(tempEntry)
        show = show.concat(tempPath)
      })
      entryObj.parse = parse
      entryObj.show = show
      entrys.push(entryObj)
    })
    return entrys
  }

  // 分析代码 需要经过两轮遍历，第一轮分析import导入，第二轮解析ast
  _scanCode(scanSource, type) {
    const entrys = this._scanFiles(scanSource, type)
    entrys.forEach((item) => {
      const parseFiles = item.parse
      if (parseFiles.length) {
        parseFiles.forEach((element, index) => {
          const showPath = item.name + '&' + item.show[index]
          try {
            if (type === CODEFILETYPE.VUE) {
              const { ast, checker, baseLine } = parseVue(element)
              const importItems = this._findImportItems(ast, showPath, baseLine)
              if (
                Object.keys(importItems).length > 0 ||
                this._browserApis.length > 0
              ) {
                this._dealAST(
                  importItems,
                  ast,
                  checker,
                  showPath,
                  item.name,
                  item.httpRepo,
                  baseLine
                ) // 递归分析AST，统计相关信息
              }
            } else if (type === CODEFILETYPE.TS) {
              const { ast, checker } = parseTs(element)
              const importItems = this._findImportItems(ast, showPath)
              if (Object.keys(importItems).length || this._browserApis.length) {
                this._dealAST(
                  importItems,
                  ast,
                  checker,
                  showPath,
                  item.name,
                  item.httpRepo
                )
              }
            }
          } catch (error) {
            const info = {
              projectName: item.name,
              httpRepo: item.httpRepo + item.show[index],
              file: item.show[index],
              stack: error.stack,
            }
            this.parseErrorInfos.push(info)
            this.addDiagnosisInfo(info)
          }
          processLog.stdout(
            chalk.green(
              `\n${item.name} ${type}分析进度: ${index + 1}/${
                parseFiles.length
              }`
            )
          )
        })
      }
    })
  }

  analysis() {
    this._installPlugins(this._analysisPlugins)
    // 扫描分析Vue
    if (this._isScanVue) {
      this._scanCode(this._scanSource, CODEFILETYPE.VUE)
    }
    // 扫描分析TS
    this._scanCode(this._scanSource, CODEFILETYPE.TS)
    // 黑名单标记
    this._blackTag(this.pluginsQueue)
    this._blackTag(this.browserQueue)
    // 代码评分
    if (this._scorePlugin) {
      if (typeof this._scorePlugin === 'function') {
        this.scoreMap = this._scorePlugin(this)
      }
      if (this._scorePlugin === 'default') {
        this.scoreMap = defaultScorePlugin(this)
      }
    } else {
      this.scoreMap = null
    }
  }
}

module.exports = CodeAnalysis
