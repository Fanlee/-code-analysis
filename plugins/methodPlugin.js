/*
 * @Author: lihuan
 * @Date: 2023-04-21 11:33:39
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 15:03:14
 * @Description:
 */
exports.methodPlugin = (analysisContext) => {
  const mapName = 'methodMap'
  analysisContext[mapName] = {}

  function isMethodCheck(
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
      // 存在于函数调用表达式中
      if (node.parent && tsCompiler.isCallExpression(node.parent)) {
        // 需要排除被当成方法入参被调用的场景
        if (
          node.parent.expression.pos === node.pos &&
          node.parent.expression.end === node.end
        ) {
          if (!context[mapName][apiName]) {
            context[mapName][apiName] = {}
            context[mapName][apiName].callNum = 1
            context[mapName][apiName].callOrigin = matchImportItem.origin
            context[mapName][apiName].callFiles = {}
            context[mapName][apiName].callFiles[filePath] = {}
            context[mapName][apiName].callFiles[filePath].projectName =
              projectName
            context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo
            context[mapName][apiName].callFiles[filePath].lines = []
            context[mapName][apiName].callFiles[filePath].lines.push(line)
          } else {
            context[mapName][apiName].callNum++
            if (
              !Object.keys(context[mapName][apiName].callFiles).includes(
                filePath
              )
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
        }
      }
      return false
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
    checkFun: isMethodCheck,
    afterHook: null,
  }
}
