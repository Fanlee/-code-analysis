/*
 * @Author: lihuan
 * @Date: 2023-04-18 15:49:53
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-20 16:47:58
 * @Description:
 */

const path = require('path')
const tsCompiler = require('typescript')
const vueCompiler = require('@vue/compiler-dom')
const md5 = require('js-md5')
const { getCode, writeTsFile } = require(path.join(__dirname, './file'))
const { VUETEMPTSDIR } = require(path.join(__dirname, './constant'))

// 解析ts代码，获取ast和checker
exports.parseTs = function (fileName) {
  const program = tsCompiler.createProgram([fileName], {})
  const ast = program.getSourceFile(fileName)
  const checker = program.getTypeChecker()
  return { ast, checker }
}

// 解析vue，获取ast和checker
exports.parseVue = function (fileName) {
  // 首先要读取到vue文件里面的代码
  const code = getCode(fileName)
  // 然后解析vue代码
  const result = vueCompiler.parse(code)
  const children = result.children
  // 获取javascript代码片段
  let tsCode = ''
  let baseLine = 0
  children.forEach((item) => {
    if (item.tag === 'script') {
      tsCode = item.children[0].content
      // script标签起始位置上一行
      baseLine = item.loc.start.line - 1
    }
  })
  const ts_hash_name = md5(fileName)
  writeTsFile(tsCode, `${VUETEMPTSDIR}/${ts_hash_name}`)
  // 获取解析后生成临时文件的代码路径
  const vue_temp_ts_name = path.join(
    process.cwd(),
    `${VUETEMPTSDIR}/${ts_hash_name}.ts`
  )
  const program = tsCompiler.createProgram([vue_temp_ts_name], {})
  const ast = program.getSourceFile(vue_temp_ts_name)
  const checker = program.getTypeChecker()
  return { ast, checker, baseLine }
}
