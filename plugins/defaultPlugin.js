/*
 * @Author: lihuan
 * @Date: 2023-04-21 11:04:38
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 14:52:21
 * @Description:
 */
exports.defaultPlugin = (analysisContext) => {
  const mapName = 'apiMap'
  // 在 codeAnalysis 分析实例上挂载一个名为 apiMap 的对象
  analysisContext[mapName] = {}

  // context : codeAnalysis分析实例上下文
  // tsCompiler : typescript编译器
  // node : 基准分析节点baseNode
  // depth : 链式调用深度
  // apiName : api完整调用名（含链式调用）
  // matchImportItem : API调用在import节点中的声明信息
  // filePath : 代码文件路径
  // projectName : 待分析代码文件所在的项目名称
  // line : API调用所在代码文件中的行信息
  function isApiCheck(
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    try {
      if (!context[mapName][apiName]) {
        context[mapName][apiName] = {} //API在代码中的完整调用名
        context[mapName][apiName].callNum = 1 //API 调用总次数
        context[mapName][apiName].callOrigin = matchImportItem.origin //API 本名，通过 as 导入的API会存在此项
        context[mapName][apiName].callFiles = {} // API调用分布情况
        context[mapName][apiName].callFiles[filePath] = {} //存在 API 调用的代码文件路径信息
        context[mapName][apiName].callFiles[filePath].projectName = projectName //存在 API 调用的代码文件所在的项目
        context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo // 用于在代码分析报告展示在线浏览代码文件的http链接前缀
        context[mapName][apiName].callFiles[filePath].lines = [] //代码文件中出现 API 调用的代码行信息
        context[mapName][apiName].callFiles[filePath].lines.push(line)
      } else {
        // 调用次数加1
        context[mapName][apiName].callNum++
        if (
          !Object.keys(context[mapName][apiName].callFiles).includes(filePath)
        ) {
          context[mapName][apiName].callFiles[filePath] = {}
          context[mapName][apiName].callFiles[filePath].projectName =
            projectName
          context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo
          context[mapName][apiName].callFiles[filePath].lines = []
          context[mapName][apiName].callFiles[filePath].lines.push(line)
        } else {
          context[mapName][apiName].callFiles[filePath].lines.push(line)
        }
      }
      return true
    } catch (error) {
      const info = {
        projectName: projectName,
        matchImportItem: matchImportItem,
        apiName: apiName,
        httpRepo: httpRepo + filePath.split('&')[1] + '#L' + line,
        file: filePath.split('&')[1],
        line: line,
        stack: error.stack,
      }
      context.addDiagnosisInfo(info)
      return false
    }
  }
  return {
    mapName: mapName,
    checkFun: isApiCheck,
    afterHook: null,
  }
}
