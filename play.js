import got from "got";

// 创建 AbortController 用于取消请求
const controller = new AbortController();

const req = got('https://nodejs.org/dist/v22.17.0/node-v22.17.0-linux-arm64.tar.xz', {
    isStream: true,       // 启用流模式
    responseType: 'buffer',
    signal: controller.signal, // 绑定取消信号

});

// let count = 0;
// req.on('data', (data) => {
//     count += data.length;
//     console.log(count, data.length);

//     // 当达到阈值时强制断开
//     if (count > 65535) {
//         controller.abort(); // 触发取消操作
//         req.destroy()
//     }
// });


let limitSize = 65536; // 需要外部赋值（例如：1024）
let buff = Buffer.alloc(limitSize);
let bi = 0;

req.on('data', data => {
    const rem = limitSize - bi;  // 计算剩余空间
    if (data.length <= rem) {
        // 当前数据块可完全放入缓冲区
        buff.set(data, bi);
        bi += data.length;
    } else {
        // 只取能填满缓冲区的部分
        buff.set(data.subarray(0, rem), bi);
        bi = limitSize;  // 标记缓冲区已满
    }
    if (bi === limitSize) {
        controller.abort(); // 触发取消操作
        req.destroy()
    }
    
    console.log('recv', data.length, ' total', bi);
});

// 处理取消事件
req.on('error', (error) => {
    if (error.name === 'AbortError') {
        console.log('连接已手动终止');
    } else {
        console.error('请求错误:' + error);
    }
});

// 可选：监听正常结束
req.on('end', () => {
    console.log('传输完成');
    if (bi <= limitSize) {
        buff = buff.subarray(0, bi);
    }
});

// 'ETIMEDOUT',
// 'ECONNRESET',
// 'EADDRINUSE',
// 'ECONNREFUSED',
// 'EPIPE',
// 'ENOTFOUND',
// 'ENETUNREACH',
// 'EAI_AGAIN'
// 'ERR_ABORTED'