/**
 * @file lib/helper.js
 */

/**
 * 
 * @param {string} value 
 * @param {*} fallback 
 * @returns {number|string}
 */
export function tryint(value, fallback = undefined) {
    if (fallback === undefined) {
        fallback = value;
    }

    let n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
}
export function tryfloat(value, fallback = undefined) {
    if (fallback === undefined) {
        fallback = value;
    }

    let n = parseFloat(value);
    return isNaN(n) ? fallback : n;
}

export function shlexSplit(str) {
    const parts = [];
    let current = '';
    let inEscape = false; // In escape sequence
    let inQuote = null;   // Current quote type: null, '"', or "'"

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (inQuote === "'") {
            // Inside single quotes
            if (inEscape) {
                current += char;
                inEscape = false;
            } else if (char === '\\') {
                inEscape = true;
            } else if (char === "'") {
                inQuote = null;
            } else {
                current += char;
            }
        } else {
            // Outside or in double quotes
            if (inEscape) {
                current += char;
                inEscape = false;
            } else if (char === '\\') {
                inEscape = true;
            } else if (char === '"') {
                if (inQuote === '"') {
                    inQuote = null;
                } else if (inQuote === null) {
                    inQuote = '"';
                } else {
                    current += char;
                }
            } else if (char === "'") {
                if (inQuote === null) {
                    inQuote = "'";
                } else {
                    current += char;
                }
            } else if ((char === ' ' || char === '\t') && inQuote === null) {
                // Space outside quotes: split token
                if (current !== '') {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
    }

    // Handle escape at end of string
    if (inEscape) {
        current += '\\';
    }

    // Push last token
    if (current !== '') {
        parts.push(current);
    }

    return parts;
}

export function topologicalSort(items) {
    // 1. 初始化数据结构
    const graph = new Map();       // 邻接表：id → 指向它的元素id列表
    const inDegree = new Map();    // 入度表：id → 入度值
    const idToItem = new Map();    // 映射：id → 原始对象

    // 2. 构建图结构和入度表
    for (const item of items) {
        const { id, direction } = item;
        idToItem.set(id, item);
        inDegree.set(id, 0);          // 初始化入度为0
        graph.set(id, []);            // 初始化邻接表
    }

    for (const item of items) {
        const { id, direction } = item;
        if (direction !== null && direction !== undefined) {
            // 添加边：direction → id (direction被id指向)
            let list = graph.get(direction); //.push(id);
            if (!list) {
                let err = new Error(`Direction "${direction}" not found in items. ("${id}" -> "${direction}")`);
                err.name = 'TopologicalSortError';
                err.code = 'DIRECTION_NOT_FOUND';
                throw err;
            }
            list.push(id);
            // 增加id的入度（因为指向direction）
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
        }
    }

    // 3. 初始化队列（入度为0的节点）
    const queue = [];
    for (const [id, degree] of inDegree) {
        if (degree === 0) queue.push(id);
    }

    // 4. BFS处理队列
    const sorted = [];
    while (queue.length > 0) {
        const id = queue.shift();
        sorted.push(idToItem.get(id));  // 添加到结果

        // 减少邻居的入度
        for (const neighbor of graph.get(id)) {
            inDegree.set(neighbor, inDegree.get(neighbor) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    // 5. 检查环（若结果长度不足说明存在循环指向）
    if (sorted.length !== items.length) {
        const err = new Error("Cycle exist between items.");
        err.name = 'TopologicalSortError';
        err.code = 'CYCLE_DETECTED';
        throw err;
    }

    return sorted;
}

export function trimFalsy(arr) {
    const start = arr.findIndex(Boolean);
    const end = arr.findLastIndex(Boolean);
    return start === -1 ? [] : arr.slice(start, end + 1);
}


/**
 * 从 UA 字符串里简单解析出浏览器和版本、平台
 */
export function parseUA(ua) {
  const result = {
    brand: 'Not A;Brand',       // 默认
    browser: 'Unknown',
    version: '0',
    platform: 'Unknown',
    mobile: false,
  };

  // Chrome / Chromium / Edge
  const mChrome = ua.match(/(Chrome|Chromium|Edge)\/([\d.]+)/);
  if (mChrome) {
    result.brand = mChrome[1] === 'Edge' ? 'Microsoft Edge' : mChrome[1];
    result.browser = result.brand;
    result.version = mChrome[2].split('.')[0];
  }

  // iPhone / iPad / Android vs. Desktop
  if (/Android/i.test(ua)) {
    result.platform = 'Android';
    result.mobile = true;
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    result.platform = 'iOS';
    result.mobile = true;
  } else if (/Macintosh/i.test(ua)) {
    result.platform = 'macOS';
  } else if (/Windows NT/i.test(ua)) {
    result.platform = 'Windows';
  }

  return result;
}

/**
 * 根据解析结果拼接 Sec-CH-UA-* 头
 */
export function buildClientHints(ua) {
  const { brand, browser, version, platform, mobile } = parseUA(ua);

  // 注意：真实浏览器里 Sec-CH-UA 会包含三组 brand+v，
  // 这里只演示简化版，实际可按需求补齐。
  const secChUa = [
    `"${brand}";v="${version}"`,
    `"${browser}";v="${version}"`,
    // 如果想加上内核 brand，可以额外加一个
    // 例如 '"Chromium";v="104"'
  ].join(', ');

  return {
    'sec-ch-ua': secChUa,
    'sec-ch-ua-mobile': mobile ? '?1' : '?0',
    'sec-ch-ua-platform': `"${platform}"`,
  };
}



export default {
    tryint,
    tryfloat,
    shlexSplit,
    topologicalSort,
    trimFalsy,
    buildClientHints,
    parseUA,
};
