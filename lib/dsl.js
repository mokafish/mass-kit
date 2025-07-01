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
                        tokens.push(new Token('instruction',content, i));
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
     * @param {'comment'|'instruction'} type 
     * @param {string[]} content 
     * @param {number} pos 
     */
    constructor(type, content, pos) {
        this.type = type; // e.g., 'comment', 'instruction'
        this.content = content; // e.g., ['hello', 'world']
        this.attr = {};
        this.pos = pos; // Start position in the original input
    }
}

export class ASTComment extends ASTNode {
    /**
     * 
     * @param {string[]} content 
     * @param {number} pos 
     */
    constructor(content, pos) {
        super('comment', content, pos);
        this.attr = {};
    }
}

export class ASTInstruction extends ASTNode {
    /**
     * 
     * @param {string[]} content 
     * @param {object} attr 
     * @param {number} pos 
     */
    constructor(content, attr, pos) {
        super('instruction', content, pos);
        this.attr = attr || {};
    }
}


export class AST {
    constructor() {
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
        this.ast = new AST();

    }

    parse(tokens) {
        const ast = new AST();
        
    }
}


export const builtinSyntaxs = [
    {
        name: 'sequence',
        match: /([\-\+\d]*):([\-\+\d]*)(?::([\-\+\d]*))?/,
        handler: (_, start, end, step) => {
            return ['seq', start, end, step]
        }
    }
]

export const builtinAttrMacros = [
      {
        match: /\^([\w\:]+)/,  // scope:id
        // match: /\^(\d+)/,
        handler: (_, id) => ['pow', id]
    },
    {
        match: /\#(\w+)/,
        handler: (_, id) => ['id', id]
    },
    {
        name: 'normal',
        match: /([^\s\=]+)(?:\=(\S*))?/,
        handler: (_, name, value) => [name, value || true]
    }
];