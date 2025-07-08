// kit/ping.js
import { EventEmitter } from 'events'
import fs from 'fs/promises';
import { RotatingArray, LinkedList } from '../lib/collection.js'
import { Interpreter } from '../lib/dsl.js'
import got from 'got';
import { rand, seq } from '../lib/generator.js';

export default class App {
    static defaultConfig = {
        concurrent: 16,
        delay: [1, 5],
        unit: [1, 1],
        header: [],
        cookies: '',
        body: '',
        form: '',
        method: 'GET',
        proxy: '',
        silent: false,
        recover: '',
        output: '',
        outputStats: '',
        outputLog: '',
        http2: false,
        tag: '{...}',
        help: false,
        version: false
    }

    static defaultHeaders = {

    }

    /**
     * 
     * @param {typeof defaultConfig} config 
     * @param {string[]} target
     */
    constructor(config, target = 'http://httpbin.org/delay/10?id={1:}') {
        /** @type {typeof App.defaultConfig} */
        this.config = { ...App.defaultConfig, ...config, }
        this.target = target
        this.eventEmitter = new EventEmitter()
        this.interpreter = new Interpreter
        this.alive = new LinkedList()
        this.history = new RotatingArray(10)
        // this.errors = new RotatingArray(10)
        this.running = false
        this.nextDelay = rand(this.config.delay[0] * 1000, this.config.delay[1] * 1000,)
        this.nextUnit = rand(...this.config.unit)
        this.nextID = seq(1)
    }

    async submit() {
        let { url, header, cookie } = this.interpreter.interpret()
        let headers = {}
        let cookies = {}
        let body = ''
        let bodySummary = ''
        // let sym = Symbol(url)
        let id = this.nextID().value
        let reqInfo = {
            id,
            url,
            headers,
            cookies,
            bodySummary,
        }

        const node = this.alive.append(id)
        this.emit('submit', reqInfo)
        const controller = new AbortController();
        try {
            const req = got(url, {
                method: 'GET',
                headers,
                cookieJar: undefined,
                body: undefined,
                isStream: true,
                responseType: 'buffer',
                throwHttpErrors: false,
                signal: controller.signal, // 绑定取消信号
            })

            // let res = null
            // req.on('response', response => {
            //     res = response
            // })

            let maxResponse = this.config.maxResponse || 65536
            let buff = Buffer.alloc(maxResponse)
            let bi = 0
            req.on('data', data => {
                const rem = maxResponse - bi;  // 计算剩余空间
                if (data.length <= rem) {
                    // 当前数据块可完全放入缓冲区
                    buff.set(data, bi);
                    bi += data.length;
                } else {
                    // 只取能填满缓冲区的部分
                    buff.set(data.subarray(0, rem), bi);
                    bi = maxResponse;  // 标记缓冲区已满
                }

                if (bi >= maxResponse) {
                    controller.abort();
                    req.destroy()
                    req.emit('end')
                }
            })

            req.on('end', () => {
                if (bi < maxResponse) {
                    buff = buff.subarray(0, bi);
                }
                this.alive.remove(node)

                let response = req.response
                let result = {
                    id,
                    url: req.requestUrl,
                    code: response.statusCode,
                    headers: response.headers,
                    // bodySummary: buff,
                }
                this.history.push(result)
                this.emit('result', result)
            })

            req.on('error', error => {
                if (error.name !== 'AbortError') {
                    this.alive.remove(node)
                    this.emit('error', error, reqInfo)
                }
            })
        } catch (error) {
            this.alive.remove(node)
            this.emit('error', error, reqInfo)
        }
        // this.emit('res', u)
    }

    async init() {
        try {
            this.interpreter.load(this.target, 'url')
            this.interpreter.load('', 'header')
            this.interpreter.load('', 'cookie')
            // this.interpreter.load('', 'form')
            // this.interpreter.load('', 'body')
            this.interpreter.ready()
            this.emit('ready')
        } catch (e) {
            this.emit('error', e)
        }
    }

    async start() {
        if (this.running) return;
        this.running = true
        this.emit('start')
        while (this.running) {
            await this.tick()
        }
    }

    async tick() {
        let currentUnit = this.nextUnit().value
        for (let i = 0; i < currentUnit && this.alive.length < this.config.concurrent; i++) {
            this.submit()
        }

        this.emit('tick')
        await sleep(this.nextDelay().value)
    }

    on(event, listener) {
        this.eventEmitter.on(event, listener);
        return this;
    }

    once(event, listener) {
        this.eventEmitter.once(event, listener)
        return this;
    }

    off(event, listener) {
        this.eventEmitter.off(event, listener)
        return this;
    }

    emit(event, ...args) {
        this.eventEmitter.emit(event, ...args);
        return this;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms))
}