// kit/ping.js
import { EventEmitter } from 'events'
import fs from 'fs/promises';
import { RotatingArray, LinkedList } from '../lib/collection.js'
import { Interpreter } from '../lib/dsl.js'

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
        this.eventEmitter = new EventEmitter()
        this.running = new LinkedList()
        this.history = new RotatingArray(10)
        this.errors = new RotatingArray(10)
    }

    start(){

    }
    
    tick() {
        got
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
