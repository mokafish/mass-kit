/** 
 *@file lib/collection.js
 */


/**
 * 基于Map的计数器类，支持键值计数操作
 * @class
 * @example
 * const counter = new Counter();
 * counter.add('apple', 3);
 * counter.inc('apple');
 * console.log(counter.get('apple')); // 输出 4
 */
export class Counter {
    /**
     * 创建计数器实例
     * @constructor
     */
    constructor() {
        /**
         * 存储计数的内部Map
         * @private
         * @type {Map<any, number>}
         */
        this.data = new Map();
    }

    /**
     * 增加指定键的计数值
     * @param {any} [key=null] - 要计数的键（默认null）
     * @param {number} [value=1] - 要增加的值（默认1）
     * @returns {number} 增加后的计数值
     */
    add(key = null, value = 1) {
        if (this.data.has(key)) {
            this.data.set(key, this.data.get(key) + value);
        } else {
            this.data.set(key, value);
        }

        return this.data.get(key);
    }

    /**
     * 将指定键的计数值增加1（add的快捷方法）
     * @param {any} [key=null] - 要计数的键（默认null）
     * @returns {number} 增加后的计数值
     */
    inc(key = null) {
        return this.add(key, 1);
    }

    /**
     * 获取指定键的当前计数值
     * @param {any} key - 要查询的键
     * @returns {number} 计数值（键不存在时返回0）
     */
    get(key) {
        return this.data.get(key) || 0;
    }

    /**
     * 直接设置指定键的计数值
     * @param {any} key - 要设置的键
     * @param {number} value - 要设置的计数值
     */
    set(key, value) {
        this.data.set(key, value);
    }

    /**
     * 检查键是否存在
     * @param {any} key - 要检查的键
     * @returns {boolean} 键是否存在
     */
    has(key) {
        return this.data.has(key);
    }

    /**
     * 删除指定键的计数
     * @param {any} key - 要删除的键
     * @returns {boolean} 是否成功删除
     */
    delete(key) {
        return this.data.delete(key);
    }

    /**
     * 重置计数器，清除所有计数
     */
    clear() {
        this.data.clear();
    }
}

/**
 * 循环数组（环形缓冲区）实现类，支持代理访问和迭代操作
 * @class
 * @example
 * const arr = new RotatingArray(3);
 * arr[0] = 'a'; // 实际存储位置: [0]
 * arr.push('b'); // 存储位置: [1,0] (cur=1)
 * arr.push('c'); // 存储位置: [2,1,0] (cur=2)
 * arr.push('d'); // 覆盖最旧元素: [2(d),1,0] -> cur=0
 * console.log(arr[0]); // 输出 'd' (最新元素)
 */
export class RotatingArray {
    /**
     * 创建循环数组实例
     * @constructor
     * @param {number} [length=0] - 数组固定长度
     * @param {any} [fill=null] - 数组初始化填充值
     * @returns {Proxy} 代理对象支持类数组访问
     */
    constructor(length = 0, fill = null) {
        /**
         * 内部存储数组
         * @private
         * @type {Array}
         */
        this.data = new Array(length).fill(fill);
        
        /**
         * 数组固定长度
         * @type {number}
         */
        this.length = length;
        
        /**
         * 当前指针位置（指向下一个写入位置）
         * @private
         * @type {number}
         */
        this.cur = 0;
        
        return new Proxy(this, {
            get: (target, prop) => {
                if (typeof target[prop] === 'function') {
                    return target[prop].bind(target);
                }

                const index = parseInt(prop, 10);
                if (!isNaN(index)) {
                    return target.get(index);
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                const index = parseInt(prop, 10);
                if (!isNaN(index)) {
                    target.set(prop, value);
                    return true;
                }
                return target[prop] = value;
            }
        });
    }

    /**
     * 计算实际存储索引（处理循环偏移）
     * @private
     * @param {number} index - 逻辑索引
     * @returns {number} 实际存储索引
     */
    rawIndex(index) {
        return (this.cur + index + this.length) % this.length;
    }

    /**
     * 获取指定逻辑索引处的值
     * @param {number} index - 要获取的逻辑索引（0=最新元素）
     * @returns {any} 索引对应的值
     */
    get(index) {
        return this.data[this.rawIndex(index)];
    }

    /**
     * 设置指定逻辑索引处的值
     * @param {number} index - 要设置的逻辑索引
     * @param {any} value - 要设置的值
     */
    set(index, value) {
        this.data[this.rawIndex(index)] = value;
    }

    /**
     * 向数组头部添加新元素（覆盖最旧元素）
     * @param {any} value - 要添加的值
     */
    push(value) {
        this.set(0, value);
        this.cur = (this.cur + 1) % this.data.length;
    }

    /**
     * 实现迭代器协议，支持for...of循环
     * @returns {Iterator} 数组迭代器
     */
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.length) {
                    return {
                        value: this.get(index++),
                        done: false
                    };
                }
                return { done: true };
            }
        };
    }

    /**
     * 获取前n个最新元素（按时间顺序从新到旧）
     * @param {number} n - 要获取的元素数量
     * @returns {Array} 包含最新元素的数组
     */
    head(n) {
        if (n <= 0) return [];
        const result = [];
        for (let i = 0; i < n; i++) {
            result.push(this.get(i));
        }
        return result;
    }

    /**
     * 获取后n个最旧元素（按时间顺序从旧到新）
     * @param {number} n - 要获取的元素数量
     * @returns {Array} 包含最旧元素的数组
     */
    tail(n) {
        if (n <= 0) return [];
        const result = [];
        for (let i = this.length - n; i < this.length; i++) {
            result.push(this.get(i));
        }
        return result;
    }
}