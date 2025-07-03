import { trimFalsy } from './helper.js';


/**
 * @callback Ticker
 * @returns {{ value: any, overflow: boolean }}
 */

/**
 * Creates a sequence generator that produces values from `start` to `end` with a specified `step`.
 * When the sequence overflows, it wraps around to the start.
 *
 * @param {number} start - The starting value of the sequence.
 * @param {number} end - The ending value of the sequence (exclusive).
 * @param {number} step - The step size for each iteration.
 * @returns {Ticker} A function that returns the next value in the sequence and whether it overflowed.
 */
export function seq(start, end, step = 1) {
    let x = start
    let ready_overflow = false
    return () => {
        let value = x
        let overflow = false

        x += step
        if (value == start && ready_overflow) {
            overflow = true
            ready_overflow = false
        } else {
            overflow = false
        }
        if (value >= end) {
            x = start
            ready_overflow = true
        }
        return { value, overflow }
    }
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