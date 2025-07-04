import { randomUUID } from 'crypto';
import fs from 'fs';
import { spawnSync, execSync } from 'child_process';
import { trimFalsy } from './helper.js';

/**
 * @file lib/generator.js
 */

/**
 * @callback Ticker
 * @returns {{ value: any, overflow: boolean }}
 */

/**
 * Creates a sequence generator that produces values from `start` to `end` with a specified `step`.
 * When the sequence overflows, it wraps around to the start.
 *
 * @param {number} start - The starting value of the sequence.
 * @param {number} end - The ending value of the sequence (inclusive).
 * @param {number} step - The step size for each iteration.
 * @returns {Ticker} A function that returns the next value in the sequence and whether it overflowed.
 */
export function seq(start, end, step = 1) {
    let current = start;
    let nextOverflow = false;  // 标记下一次调用是否应返回overflow

    return function() {
        const value = current;
        const overflow = nextOverflow;
        
        // 计算下一个值并检查是否需要重置
        let next = current + step;
        nextOverflow = false;
        if (next > end) {
            next = start;
            nextOverflow = true;
        }
        current = next;

        return { value, overflow };
    };
}


export function rand(min, max, countdown) {
    let count = countdown
    return () => {
        let value = Math.floor(Math.random() * (max + 1 - min)) + min
        let overflow = true;
        if (countdown) {
            overflow = count == countdown
            count = count == 1 ? countdown : (count - 1)
        }

        return { value, overflow }
    }
}

export function choose(values, orderly) {
    // const pool = values.filter(Boolean).map(v => v.trim());
    const pool = trimFalsy(values.map(v => v.trim()));
    const tick = orderly
        ? seq(0, pool.length - 1)
        : rand(0, pool.length - 1, pool.length)
    return () => {
        let x = tick()
        let value = pool[x.value]
        let overflow = x.overflow
        return { value, overflow }
    }
}

export function chooseFromFile(file, orderly) {
    const lines = fs.readFileSync(file, 'utf-8').trim().split('\n')
    return choose(lines, orderly)
}

export function randText(chars, minLength, maxLength) {
    const ntick = rand(minLength, maxLength)
    const itick = rand(0, chars.length - 1)
    return () => {
        let arr = Array(ntick().value)
        for (let i = 0; i < arr.length; i++) {
            arr[i] = chars[itick().value]
        }
        return { value: arr.join(''), overflow: true }
    }
}