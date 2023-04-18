/*
 * @Author: lihuan
 * @Date: 2023-04-18 15:49:53
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-18 16:56:31
 * @Description:
 */
const tsCompiler = require('typescript')

// 解析ts代码，获取ast和checker
exports.parseTs = function (fileName) {
  const program = tsCompiler.createProgram([fileName], {})
  const ast = program.getSourceFile(fileName)
  const checker = program.getTypeChecker()
  return { ast, checker }
}

