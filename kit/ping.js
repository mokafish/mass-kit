// kit/ping.js
import { EventEmitter } from 'events'
import fs from 'fs/promises';
import { RotatingArray, LinkedList } from '../lib/collection.js'
import { Interpreter } from '../lib/dsl.js'
import got from 'got';
import { rand } from '../lib/generator.js';

export const defaultConfig = {
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

export class App {
    /**
     * 
     * @param {typeof defaultConfig} config 
     * @param {string[]} target
     */
    constructor(config, target) {
        this.config = { ...config, ...defaultConfig }
        this.target = target
        this.eventEmitter = new EventEmitter()
        this.interpreter = new Interpreter
        this.alive = new LinkedList()
        this.history = new RotatingArray(10)
        this.errors = new RotatingArray(10)
        this.running = false
        this.nextDelay = rand(...this.config.delay)
        this.nextUnit = rand(...this.config.unit)

    }

    async submit() {
        let { u, h, c } = this.interpreter.interpret()
        let headers = {}

        this.emit('submit', u)

        const g = got(u, {
            method: 'GET',
            headers,
            cookieJar: undefined,
            body: undefined,
            isStream: true,
            responseType: 'buffer',
            throwHttpErrors: false,
        })


        let limitSize
        let buff = Buffer.alloc(limitSize)
        let bi = 0
        g.on('data', data => {

        })
        g.on('end', () => {

        })

        this.emit('res', u)
    }

    async init() {
        this.interpreter.load(this.target, 'u')
        this.interpreter.load('', 'h')
        this.interpreter.load('', 'c')
        // this.interpreter.load('', 'f')
        // this.interpreter.load('', 'b')
        this.interpreter.ready()
    }

    async start() {
        if (this.running) return;
        while (this.running) {
            this.tick()
        }
    }

    async tick() {
        let currentUnit = this.nextUnit().value
        for (let i = 0; i < currentUnit; i++) {
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

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms))
}