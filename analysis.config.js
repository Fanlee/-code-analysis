/*
 * @Author: lihuan
 * @Date: 2023-04-19 14:01:53
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 16:02:31
 * @Description:
 */
const { execSync } = require('child_process') // 子进程操作
const DefaultBranch = 'master' // 默认分支常量
function getGitBranch() {
  // 获取当前分支
  try {
    const branchName = execSync('git symbolic-ref --short -q HEAD', {
      encoding: 'utf8',
    }).trim()
    // console.log(branchName);
    return branchName
  } catch (e) {
    return DefaultBranch
  }
}

module.exports = {
  scanSource: [
    {
      // 必须，待扫描源码的配置信息
      name: 'Market', // 必填，项目名称
      path: ['src', 'test'], // 必填，需要扫描的文件路径（基准路径为配置文件所在路径）
      packageFile: 'package.json', // 可选，package.json 文件路径配置，用于收集依赖的版本信息
      format: null, // 可选, 文件路径格式化函数,默认为null,一般不需要配置
      httpRepo: `https://gitlab.xxx.com/xxx/-/blob/${getGitBranch()}/`, // 可选，项目gitlab/github url的访问前缀，用于点击行信息跳转，不填则不跳转
    },
  ],
  analysisTarget: 'framework', // 必须，要分析的目标依赖名
  analysisPlugins: [], // 可选，自定义分析插件，默认为空数组，一般不需要配置
  blackList: ['document.getElementById'], // 可选，需要标记的黑名单api，默认为空数组
  browserApis: ['window', 'document', 'history', 'location'], // 可选，要分析的BrowserApi，默认为空数组
  reportDir: 'report', // 可选，生成代码分析报告的目录，默认为'report',不支持多级目录配置
  reportTitle: 'Market依赖调用分析报告', // 可选，分析报告标题，默认为'依赖调用分析报告'
  isScanVue: true, // 可选，是否要扫描分析vue中的ts代码，默认为false
  scorePlugin: 'default', // 可选，评分插件: Function|'default'|null, default表示运行默认插件，默认为null表示不评分
  alarmThreshold: 90, // 可选，开启代码告警的阈值分数(0-100)，默认为null表示关闭告警逻辑 (CLI模式生效)
}
