export class Token {
    /**
     * 
     * @param {'comment' | 'instruction' } type 
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
        let currentState = 'comment'; // 'comment' or 'instruction'
        let i = 0; // Start position of current token
        let j = 0;   // Current position in input
        let inEscape = false; // In escape sequence (for instruction block)
        let inQuote = null;   // Current quote type: null, '"', or "'" (for instruction block)

        while (j < input.length) {
            if (currentState === 'comment') {
                // Check if we have a begin sequence at current position
                if (input.substr(j, this.begin.length) === this.begin) {
                    // Push any preceding comment
                    if (j > i) {
                        // tokens.push(new Token('comment', [input.substring(i, j)], i));
                        tokens.push(new Token('comment', input.substring(i, j), i));
                    }
                    // Enter instruction state
                    currentState = 'instruction';
                    // Move past begin sequence
                    j += this.begin.length;
                    i = j; // Start of instruction content
                    // Reset instruction parsing state
                    inEscape = false;
                    inQuote = null;
                } else {
                    j++;
                }
            } else { // instruction state
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
                        // tokens.push(new Token('instruction', this.split(content), i));
                        tokens.push(new Token('instruction', content, i));
                        // Move past end sequence
                        j += this.end.length;
                        i = j;
                        currentState = 'comment';
                    } else {
                        j++;
                    }
                }
            }
        }

        // Handle any remaining content after loop
        if (currentState === 'comment') {
            if (i < j) {
                // tokens.push(new Token('comment', [input.substring(i, j)], i));
                tokens.push(new Token('comment', input.substring(i, j), i));
            }
        } else {
            // Unclosed instruction block
            const content = input.substring(i, j);
            // tokens.push(new Token('instruction', this.split(content), i));
            tokens.push(new Token('instruction', content, i));
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
     * @param {Token[]} context 
     */
    constructor(type, context) {
        this.type = type; // e.g., 'comment', 'instruction'
        this.context = context; // e.g., ['hello', 'world']
    }
}

export class ASTComment extends ASTNode {
    /**
     * 
     * @param {Token[]} context 
     */
    constructor(context) {
        super('comment', context);
    }

    toString() {
        return this.context.map(token => token.content).join('');
    }
}

export class ASTInstruction extends ASTNode {
    /**
     * 
     * @param {Token[]} context 
     * @param {string[]} ins 
     * @param {object} attr 
     */
    constructor(context, ins, attr = {}) {
        super('instruction', context);
        // let instruction = context.map(v=>Lexer.prototype.split(v.content)).flat();
        this.ins = ins;
        this.attr = attr
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
        if (node instanceof ASTNode) {
            this.nodes.push(node);
        } else {
            throw new Error('Invalid AST node');
        }
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
            if (token.type === 'comment') {
                const commentNode = new ASTComment([token]);
                ast.addNode(commentNode);
            } else /*if (token.type === 'instruction')*/ {
                const parts = Lexer.prototype.split(token.content);
                const ins = this.parseSyntax(parts[0]);
                const attr = this.parseAttrs(parts.slice(1));
                const instructionNode = new ASTInstruction([token], ins, attr);
                ast.addNode(instructionNode);
            }

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
        return ['invalid', source];
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
    constructor() {
        // Initialize evaluator state if needed
    }

    evaluate(ast) {
        // Implement evaluation logic for the AST
        // This could involve executing instructions, resolving attributes, etc.
        // For now, just return the AST as is
        return ast;
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


/**********************************
 * Built-in syntax and attribute macros
 ***********************************/

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