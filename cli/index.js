#!/usr/bin/env node
// cli/index.js
import fs from 'fs/promises';
import meow from 'meow';

const cli = meow(`
  Usage
    mass [options] <command> [args]

  Options
    --silent
  Command
    ping 
    download
    upload

`, {
    importMeta: import.meta,
    flags: {
        silent: {
            type: 'boolean',
            shortFlag: 's'
        },
    }
});

function parseRangeExpr(expr) {
    const parts = expr.split('-');
    if (parts.length === 2) {
        const a = parseFloat(parts[0])
        const b = parseFloat(parts[1])
        return [a, b].sort()
    } else {
        const n = parseFloat(expr)
        return [n, n];
    }
}

