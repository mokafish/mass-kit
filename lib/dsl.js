import helper from "./helper.js";

export class Token {
    /**
     * 
     * @param {'text' | 'tag' } type 
     * @param {string} content 
     * @param {number} j 
     */
    constructor(type, content, pos) {
        this.type = type;
        this.content = content;
        this.pos = pos;
    }
}

export class Lexer {
    constructor(begin = '{', end = '}') {
        this.begin = begin;
        this.end = end;
    }

    tokenize(input) {
        const tokens = [];
        let currentState = 'text'; // 'text' or 'tag'
        let i = 0; // Start position of current token
        let j = 0;   // Current position in input
        let inEscape = false; // In escape sequence (for tag block)
        let inQuote = null;   // Current quote type: null, '"', or "'" (for tag block)

        while (j < input.length) {
            if (currentState === 'text') {
                // Check if we have a begin sequence at current position
                if (input.substr(j, this.begin.length) === this.begin) {
                    // Push any preceding text
                    if (j > i) {
                        // tokens.push(new Token('text', [input.substring(i, j)], i));
                        tokens.push(new Token('text', input.substring(i, j), i));
                    }
                    // Enter tag state
                    currentState = 'tag';
                    // Move past begin sequence
                    j += this.begin.length;
                    i = j; // Start of tag content
                    // Reset tag parsing state
                    inEscape = false;
                    inQuote = null;
                } else {
                    j++;
                }
            } else { // tag state
                if (inEscape) {
                    // Current char is escaped, treat as normal
                    inEscape = false;
                    j++;
                } else {
                    const char = input[j];
                    if (char === '\\') {
                        // Start escape sequence
                        inEscape = true;
                        j++;
                    } else if (char === '"' || char === "'") {
                        // Handle quotes
                        if (inQuote === char) {
                            // Close matching quote
                            inQuote = null;
                        } else if (inQuote === null) {
                            // Open new quote
                            inQuote = char;
                        }
                        j++;
                    } else if (inQuote === null && input.substr(j, this.end.length) === this.end) {
                        // Found end sequence outside quotes
                        const content = input.substring(i, j);
                        // tokens.push(new Token('tag', this.split(content), i));
                        tokens.push(new Token('tag', content, i));
                        // Move past end sequence
                        j += this.end.length;
                        i = j;
                        currentState = 'text';
                    } else {
                        j++;
                    }
                }
            }
        }

        // Handle any remaining content after loop
        if (currentState === 'text') {
            if (i < j) {
                // tokens.push(new Token('text', [input.substring(i, j)], i));
                tokens.push(new Token('text', input.substring(i, j), i));
            }
        } else {
            // Unclosed tag block
            const content = input.substring(i, j);
            // tokens.push(new Token('tag', this.split(content), i));
            tokens.push(new Token('tag', content, i));
        }

        return tokens;
    }

}

export class ASTNode {
    /**
     * 
     * @param {string} opcode 
     * @param {any[]} data 
     * @param {object} attr 
     */
    constructor(opcode, data = [], attr = {}) {
        this.opcode = opcode;
        this.data = data;
        this.attr = attr;
    }
}


export class AST {
    constructor() {
        /**
         * @type {ASTNode[]}
         */
        this.nodes = [];
    }

    addNode(node) {
        this.nodes.push(node);
    }

    getNodes() {
        return this.nodes;
    }
}

export class Parser {
    constructor(syntaxs, attrMacros, lexer = new Lexer()) {
        this.syntaxs = syntaxs || builtinSyntaxs
        this.attrMacros = attrMacros || builtinAttrMacros
        this.lexer = lexer;
    }
    /**
     * 
     * @param {Token[]|string} tokens 
     * @returns 
     */
    parse(tokens) {
        if (typeof tokens === 'string') {
            tokens = this.lexer.tokenize(tokens);
        }

        const ast = new AST();
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let opcode, data, attr;
            if (token.type === 'text') {
                opcode = 'echo';
                data = [token.content];
                attr = {};
            } else /*if (token.type === 'tag')*/ {
                const parts = helper.shlexSplit(token.content);
                [opcode, ...data] = this.parseSyntax(parts[0]);

                if (opcode === '') {
                    // If no opcode matched, treat as a text node
                    // TODO: emit warning 
                    opcode = 'echo';
                    data = [this.lexer.begin + token.content + this.lexer.end];
                }

                attr = this.parseAttrs(parts.slice(1));

            }
            ast.addNode(new ASTNode(opcode, data, attr));
        }
        return ast;
    }

    /**
     * 
     * @param {string} source 
     * @returns {string[]}
     */
    parseSyntax(source) {
        for (const syntax of this.syntaxs) {
            const match = syntax.match.exec(source);
            if (match) {
                return syntax.handler(...match);
            }
        }
        // If no syntax matched, return the source as a single element array
        return ['', source];
    }
    /**
     * 
     * @param {string[]} sources 
     * @returns {object}
     */
    parseAttrs(sources) {
        const attr = {};
        for (const source of sources) {
            // let matched = false;
            for (const macro of this.attrMacros) {
                const match = macro.match.exec(source);
                if (match) {
                    // matched = true;
                    const [name, value] = macro.handler(...match);
                    attr[name] = value;
                    break; // Stop after the first match
                }
            }
            // if (!matched) {
            //     // If no macro matched, treat as a normal attribute
            //     const [name, value] = this.attrMacros[0].handler(null, source);
            //     attrs[name] = value;
            // }
        }
        return attr;
    }
}

export class Runtime {
    constructor(processor = builtinProcessor) {
        this.processor = processor;
        this.heap = new Map();
        this.symbolTable = new Map();
        this.autoId = {};
    }

    register(node, scope = 'global') {
        let id = node.attr.id
        if (id === undefined) {
            if (this.autoId[scope] === undefined) {
                this.autoId[scope] = 0;
            }
            id = this.autoId[scope]++;
        }

        this.symbolTable.set(`${scope}:${id}`, node);
        this.heap.set(node, {
            calculator: this.processor[node.opcode](...node.data),
            value: null,
            scope: scope,
            id: id,
        });
        return id;
    }

    evaluate(node) {
        if (node.opcode === 'ref') {
            return this.resolveReference(node.data);
        }

        const it = this.heap.get(node);
        // if (!it) {
        //     throw new Error(`No calculator for node: ${node.opcode}`);
        // }

        it.value = it.calculator.tick();

        if (it.calculator.overflow) {
            // console.warn(`Overflow occurred: ${node.opcode}`);
        }

        return it.value
    }


    heapSet(node, value) {
        this.heap.set(node, value);
    }

    heapGet(node) {
        return this.heap.get(node);
    }

    getNode(id) {
        return this.symbolTable.get(id);
    }

    /**
     * 解析引用标识符
     * @param {string} refId 
     * @returns 
     */
    resolveReference(refId) {
        const node = this.symbolTable.get(refId);
        if (!node) throw new Error(`Undefined reference: ${refId}`);
        return this.get(node);
    }
}

export class Interpreter {
    constructor(
        bracket = ['{', '}'],
        syntaxs = builtinSyntaxs,
        processor = builtinProcessor,
        attrMacros = builtinAttrMacros
    ) {
        this.lexer = new Lexer(...bracket);
        this.parser = new Parser(syntaxs, attrMacros, this.lexer);
        this.runtime = new Runtime(processor);
        this.context = {};
    }

    load(input, scope = 'main') {
        const tokens = this.lexer.tokenize(input);
        const ast = this.parser.parse(tokens);
        this.context[scope] = ast;

        for (const node of ast.getNodes()) {
            if (node.opcode !== 'echo') {
                this.runtime.register(node, scope);
            }
        }
    }

    ready(){
 
    }

    interpret() {
        for(let node of this.runtime.heap.keys()) {
            if (node.opcode !== 'echo') {
                this.runtime.evaluate(node);
            }
        }
    }
}

/**********************************
 * Built-in syntax and attribute macros
 ***********************************/

export const builtinProcessor = {
    seq: (start, end, step) => {
        let x = start
        let overflow = false
        let ready_overflow = false
        return {
            overflow,
            tick: () => {
                let n = x
                x += step
                if (n == start && ready_overflow) {
                    overflow = true
                    ready_overflow = false
                } else {
                    overflow = false
                }
                if (n > end) {
                    x = start
                    ready_overflow = true
                }
                return n
            }
        }
    },

    echo: (value) => {
        return {
            overflow: true,
            tick: () => value
        }
    }
}



export const builtinSyntaxs = [
    {
        name: 'sequence',
        match: /([\-\+\d]*):([\-\+\d]*)(?::([\-\+\d]*))?/,
        handler: (_, start, end, step) => {
            [start, end, step] = [start, end, step].map(v => helper.tryint(v, 0));
            step = step || 1;
            end = end || Number.MAX_SAFE_INTEGER;
            return ['seq', start, end, step]
        }
    }
]

export const builtinAttrMacros = [
    {
        name: 'set pow scope:id(ref)',
        match: /\^([\w\:]+)/,
        // match: /\^(\d+)/,
        handler: (_, id) => ['pow', id]
    },
    {
        name: 'set id',
        match: /\#(\w+)/,
        handler: (_, id) => ['id', id]
    },
    {
        name: 'base',
        match: /([^\=]+)(?:\=(.*))?/,
        handler: (_, name, value) => [name, value || true]
    }
];