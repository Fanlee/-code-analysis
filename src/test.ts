/*
 * @Author: lihuan
 * @Date: 2023-04-19 17:29:45
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 15:42:41
 * @Description: 
 */
import { app } from 'framework';          // 项目依赖，通过webpack alia配置指向目标仓库
import { clone } from 'loadsh';           // 第三方依赖，一般安装在node_modules下

function cloneInfo (info: string) {
    clone(info);
}
function getInfos (info: string) {
    const result = app.get(info);                  
    return result;
}

function back(){
    window.history.back();
}
function getDom(){
    return document.getElementById('idxxx');
}