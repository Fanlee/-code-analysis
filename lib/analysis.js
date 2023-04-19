/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:28:51
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-19 16:49:06
 * @Description:
 */

const path = require('path')
const tsCompiler = require('typescript')
const { scanFileTs } = require(path.join(__dirname, './file'))
const { parseTs } = require(path.join(__dirname, './parse'))
const config = require('../analysis.config')

const tsCode = `
  import { environment } from 'framework';        // named import
  import api from 'framework';                    // default import
  import { request as req } from 'framework';     // namespaced import
  import * as APP from 'framework';               // namespaced imort
`

const ast = tsCompiler.createSourceFile(
  'xxx',
  tsCode,
  tsCompiler.ScriptTarget.Latest,
  true
)

function _scanFiles(scanSource, type) {
  let entrys = []
  scanSource.forEach((item) => {
    const entryObj = {
      name: item.name,
      httpRepo: item.httpRepo,
    }
    let parse = []
    const scanPath = item.path
    scanPath.forEach((sitem) => {
      let tempEntry = []
      tempEntry = scanFileTs(sitem)
      parse = parse.concat(tempEntry)
    })
    entryObj.parse = parse
    entrys.push(entryObj)
  })
  return entrys
}

function _scanCode(scanSource, type) {
  let entrys = _scanFiles(scanSource, type)
  entrys.forEach((item) => {
    const parseFiles = item.parse
    if (parseFiles.length) {
      parseFiles.forEach((element, eIndex) => {
        const { ast, checher } = parseTs(element)
        const importItems = _findImportItems(ast)
        if (Object.keys(importItems).length > 0) {
          this._dealAST(importItems, ast)
        }
      })
    }
  })
}

function _findImportItems(ast, filePath, baseLine = 0) {
  let importItems = {}

  function dealImports(temp) {
    importItems[temp.name] = {}
    importItems[temp.name].origin = temp.origin
    importItems[temp.name].symbolPos = temp.symbolPos
    importItems[temp.name].symbolEnd = temp.symbolEnd
    importItems[temp.name].identifierPos = temp.identifierPos
    importItems[temp.name].identifierEnd = temp.identifierEnd
  }

  function walk(node) {
    tsCompiler.forEachChild(node, walk)
    const line =
      ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1

    if (tsCompiler.isImportDeclaration(node)) {
      if (
        node.moduleSpecifier &&
        node.moduleSpecifier.text &&
        node.moduleSpecifier.text === 'framework'
      ) {
        if (node.importClause) {
          // default 默认导入
          if (node.importClause.name) {
            let temp = {
              name: node.importClause.name.escapedText,
              origin: null,
              symbolPos: node.importClause.pos,
              symbolEnd: node.importClause.end,
              identifierPos: node.importClause.name.pos,
              identifierEnd: node.importClause.name.end,
              line: line,
            }
            dealImports(temp)
          }
          if (node.importClause.namedBindings) {
            if (tsCompiler.isNamedImports(node.importClause.namedBindings)) {
              if (
                node.importClause.namedBindings.elements &&
                node.importClause.namedBindings.elements.length
              ) {
                const tempArr = node.importClause.namedBindings.elements
                tempArr.forEach((element) => {
                  if (tsCompiler.isImportSpecifier(element)) {
                    let temp = {
                      name: element.name.escapedText,
                      origin: element.propertyName
                        ? element.propertyName.escapedText
                        : null,
                      symbolPos: element.pos,
                      symbolEnd: element.end,
                      identifierPos: element.name.pos,
                      identifierEnd: element.name.end,
                      line: line,
                    }
                    dealImports(temp)
                  }
                })
              }
            }
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
  }
  walk(ast)
  return importItems
}

console.log(_findImportItems(ast))
