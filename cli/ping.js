#!/usr/bin/env node
// cli/ping.js
import fs from 'fs/promises';
import meow from 'meow';


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

const cli = meow(`
  Usage
    mass-ping [options] [args]

  Options
    -c, --concurrent <num>     Set concurrent workers (default: 16)
    -d, --delay <min[-max]>    Delay between cycle in seconds (default: 1-5)
    -u, --unit <min[-max]>     Requests per cycle (default: 1)
    -H, --header <k:v>         Add custom request header (repeatable)
    -C, --cookies <file>       Load cookies.txt or cookies.json  from file
    -b, --body <file>          File to use as request raw body
    -f, --form <file>          File to use as request data
    -m, --method <name>        HTTP method to use 
    -p, --proxy <url>          Proxy server to use (http/socks5)
    -s, --silent               Suppress output logging
    -r, --recover <file>       Resume or create a session
    -o, --output <dir>         Output directory for results
        --output-stats <file>  File to save statistics
        --output-log <file>    File to save log
        --http2                Use HTTP/2 protocol
        --tag                  Config tag brackets
    -h, --help                 Show this help
    -v, --version              Show version

  Arguments
    ...   targets

  Examples
    mass-ping -c 16 \\
      'https://example.com/?id={0:}&user={t5:32}&t={ms}'
`, {
    importMeta: import.meta,
    flags: {
        concurrent: {
            type: 'number',
            shortFlag: 'c',
            default: 16
        },
        delay: {
            type: 'string',
            shortFlag: 'd',
            default: '1-5'
        },
        unit: {
            type: 'string',
            shortFlag: 'u',
            default: '1'
        },
        header: {
            type: 'string',
            shortFlag: 'H',
            isMultiple: true,
            default: []
        },
        cookies: {
            type: 'string',
            shortFlag: 'C',
            default: '',
        },
        body: {
            type: 'string',
            shortFlag: 'b',
            default: '',

        },
        form: {
            type: 'string',
            shortFlag: 'f',
            default: '',

        },
        method: {
            type: 'string',
            shortFlag: 'm',
            default: 'GET',
        },
        proxy: {
            type: 'string',
            shortFlag: 'p',
            default: '',
        },
        silent: {
            type: 'boolean',
            shortFlag: 's',
            default: false
        },
        recover: {
            type: 'string',
            shortFlag: 'r',
            default: '',
        },
        output: {
            type: 'string',
            shortFlag: 'o',
            default: '',
        },
        outputStats: {
            type: 'string',
            default: '',
        },
        outputLog: {
            type: 'string',
            default: '',
        },
        http2: {
            type: 'boolean',
            default: false
        },
        tag: {
            type: 'string',
            default: '{...}'
        },
        help: {
            type: 'boolean',
            shortFlag: 'h',
            default: false
        },
        version: {
            type: 'boolean',
            shortFlag: 'v',
            default: false
        }
    }
})

cli.flags.delay = parseRangeExpr(cli.flags.delay)
cli.flags.unit = parseRangeExpr(cli.flags.unit)

console.log(cli.flags);




