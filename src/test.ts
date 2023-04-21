/*
 * @Author: lihuan
 * @Date: 2023-04-19 17:29:45
 * @LastEditors: lihuan
 * @LastEditTime: 2023-04-21 10:56:10
 * @Description: 
 */
import { app } from 'framework';                   // import app 定义
import { environment as env } from 'framework';    // import request 定义

function doWell () {
    const app = 4;                                 // 局部常量 app 定义
    if(env){                                       // import app 调用(as别名)
        return app;
    }else{
        return 0;
    }
}
function getInfos (info: string) {
    const result = app.get.set(info);                  // import app 调用(链式) 
    return result;
}