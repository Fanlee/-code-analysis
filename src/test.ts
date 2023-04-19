import { app } from 'framework';        // import app 定义

const dataLen = 3;
let name = 'iceman';

function doWell () {
    const app =4;                       // 局部常量 app 定义
    return app;                         // 局部常量 app 调用
}

function getInfos (info: string) {
    const result = app.get(info);       // import app 调用 
    return result;
}