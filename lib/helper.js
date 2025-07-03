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
        if (direction !== null) {
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

export default {
    tryint,
    tryfloat,
    shlexSplit,
    topologicalSort
};
