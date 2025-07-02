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

    split(str) {
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
    constructor(syntaxs, attrMacros) {
        this.syntaxs = syntaxs || builtinSyntaxs
        this.attrMacros = attrMacros || builtinAttrMacros
    }

    parse(tokens) {
        const ast = new AST();
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let opcode, data, attr;
            if (token.type === 'text') {
                opcode = 'echo';
                data = [token.content];
                attr = {};
            } else /*if (token.type === 'tag')*/ {
                const parts = Lexer.prototype.split(token.content);
                [opcode, ...data] = this.parseSyntax(parts[0]);

                if (opcode === '') {
                    // If no opcode matched, treat as a text node
                    // TODO: emit warning 
                    opcode = 'echo';
                    data = [token.content];
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

export class Evaluator {
    constructor(processor = builtinProcessor) {
        // Initialize evaluator state if needed
        this.processor = processor;
        this.processUnits = new Map();
    }

    register(node) {
        this.processUnits.set(node, this.processor[node.ins[0]](...node.ins.slice(1)));
    }

    /**
     * 
     * @param {ASTNode} node 
     * @param {object} envs
     * @param {string} currentEnv
     */
    evaluate(node, envs, currentEnv) {
        if (node.type === 'text') {
            // Handle text nodes, if needed
            return;
        } else if (node.type === 'tag') {
            // Evaluate tag nodes
            this.register(node);
            const processUnit = this.processUnits.get(node);
            if (processUnit) {
                // Execute the process unit and return its result
                return processUnit.tick();
            } else {
                throw new Error(`No processor found for tag: ${node.ins[0]}`);
            }
        } else {
            throw new Error(`Unknown AST node type: ${node.type}`);
        }
    }

    tryint(value) {
        let n = parseInt(value, 10);
        return isNaN(n) ? 0 : n;
    }

    tryfloat(value) {
        let n = parseFloat(value);
        return isNaN(n) ? 0 : n;
    }
}

// export class Environment {
//     constructor() { 

//     }
// }

export class Runtime {
    constructor() {
        // this.env = {}
        this.heap = new Map();
        this.symbolTable = new Map();
        this.autoId = 0;
    }

    /**
     * 
     * @param {ASTNode} node
     */
    register(node) {
        const id = node.attr.id || String(this.autoId++);
        this.symbolTable.set(id, node);
        this.heap.set(node, null)
    }
    /**
     * 
     * @param {ASTNode} node
     * @param {*} value 
     */
    set(node, value) {
        this.heap.set(node, value)
    }
    /**
     * 
     * @param {ASTNode} node
     * @returns {*} value
     */
    get(node) {
        return this.heap.get(node);
    }

    /**
     * 
     * @param {string} id 
     * @return {ASTNode}
     */
    getNode(id) {
        return this.symbolTable.get(id);
    }

    reference(id) {
        const node = this.getNode(id);
        return this.get(node);
    }
}

export class Interpreter {
    constructor(config={}) {
        this.lexer = new Lexer();
        this.parser = new Parser();
        this.evaluator = new Evaluator();
        this.environment = {}
    }

    load(input, scope = 'main') {
        // Tokenize the input   
        const tokens = this.lexer.tokenize(input);
        // Parse the tokens into an AST
        const ast = this.parser.parse(tokens);
        // create a runtime environment
        // Register the AST nodes for evaluation  
        const runtime = new Runtime();
        this.environment[scope] = runtime;
        for (const node of ast.getNodes()) {
            runtime.register(node);
            this.evaluator.register(node);
        }

    }

    interpret() {

        return
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
            [start, end, step] = [start, end, step].map(v => Evaluator.prototype.tryint(v));
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