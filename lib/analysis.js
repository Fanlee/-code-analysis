/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:28:51
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-19 17:50:01
 * @Description:
 */

const path = require('path')
const tsCompiler = require('typescript')
const { scanFileTs } = require(path.join(__dirname, './file'))
const { parseTs } = require(path.join(__dirname, './parse'))
const config = require('../analysis.config')

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
        const { ast, checker } = parseTs(element)
        const importItems = _findImportItems(ast)
        if (Object.keys(importItems).length > 0) {
          _dealAST(importItems, ast, checker)
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

function _dealAST(ImportItems, ast, checker, baseLine = 0) {
  const ImportItemNames = Object.keys(ImportItems)

  function walk(node) {
    tsCompiler.forEachChild(node, walk)
    if (
      tsCompiler.isIdentifier(node) &&
      node.escapedText &&
      ImportItemNames.length &&
      ImportItemNames.includes(node.escapedText)
    ) {
      const matchImportItem = ImportItems[node.escapedText]
      if (
        node.pos !== matchImportItem.identifierPos &&
        node.end !== matchImportItem.identifierEnd
      ) {
        const symbol = checker.getSymbolAtLocation(node)
        if (symbol && symbol.declarations && symbol.declarations.length) {
          const nodeSymbol = symbol.declarations[0]
          if (
            matchImportItem.symbolPos == nodeSymbol.pos &&
            matchImportItem.symbolEnd === nodeSymbol.end
          ) {
            // 链式
            if (node.parent) {
              const { baseNode, depth, apiName } = _checkPropertyAccess(node)
              console.log(apiName)
            } else {
              console.log(apiName)
            }
          } else {
            console.log('干扰节点')
          }
        }
      }
    }
  }
  walk(ast)
}

function _checkPropertyAccess(node, index = 0, apiName = '') {
  if (index > 0) {
    apiName = apiName + '.' + node.name.escapedText
  } else {
    apiName = apiName + node.escapedText
  }
  if (tsCompiler.isPropertyAccessExpression(node.parent)) {
    index++
    return _checkPropertyAccess(node.parent, index, apiName)
  } else {
    return {
      baseNode: node,
      depth: index,
      apiName: apiName,
    }
  }
}

_scanCode(config.scanSource)

// const ImportItems = _findImportItems(ast)
// _dealAST(ImportItems, ast)
