/*
 * @Author: lihuan
 * @Date: 2023-04-18 14:32:04
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-18 15:02:18
 * @Description:
 */
const path = require('path')
const { scanFileTs } = require('./lib/file')

console.log(scanFileTs('src'))
