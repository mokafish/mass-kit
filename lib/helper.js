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

export default {
    tryint, 
    tryfloat,
    shlexSplit
};
