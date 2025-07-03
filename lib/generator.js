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
export function seq(start, end, step) {
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
    let ready_overflow = false
    return () => {
        let value = Math.floor(Math.random() * (max - min)) + min
        let overflow = true;
        if (countdown) {
            // if (--count == 0) {
            //     count = countdown
            //     ready_overflow = true
            // } else {
            //     ready_overflow = false
            // }

            // if(count == countdown-1 && ready_overflow){
            //     overflow = true
            // }else{
            //     overflow = false
            // }
        }

        return { value, overflow }
    }
}