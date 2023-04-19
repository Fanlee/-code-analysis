/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:16:34
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-19 14:26:51
 * @Description:
 */
const path = require('path')
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
        const {} = parseTs(element)
      })
    }
  })
}

console.log(_scanFiles(config.scanSource))
