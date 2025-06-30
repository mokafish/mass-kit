export class Token {
    constructor(type, raw, pos) {
        this.type = type;
        this.raw = raw;
        this.pos = pos;
        // this.current = type == 'text' ? raw : null
    }

    // evaluate() {
    //     if (this.type == 'text')
    //         return raw

    //     this.current = `[evaluated:${this.raw}]`
    //     return this.current
    // }

    // toString() {
    //     return String(this.current)
    // }
}

export class Lexer {
    constructor(input, tagStart = '{', tagEnd = '}') {
        this.input = input;
        this.tagStart = tagStart;
        this.tagEnd = tagEnd;
        this.regex = new RegExp(`\\${this.tagStart}[^\\${this.tagStart}\\${this.tagEnd}]*\\${this.tagEnd}`, 'g');
    }

    tokenize() {
        const tokens = [];
        let match;
        let pos = 0;
        while ((match = this.regex.exec(this.input)) !== null) {
            // 处理匹配前的文本
            const textBefore = this.input.slice(pos, match.index);
            if (textBefore.length > 0) {
                tokens.push(new Token('text', textBefore, pos));
            }
            // 处理占位符
            const tag = match[0].slice(1, -1);
            tokens.push(new Token('tag', tag, match.index));
            pos = match.index + match[0].length;
        }

        // 处理剩余的文本
        const textAfter = this.input.slice(pos);
        if (textAfter.length > 0) {
            tokens.push(new Token('text', textAfter, pos));
        }

        return tokens;
    }
}

export class AST {
    constructor() {
        // this.syntaxs
    }
}

export class ASTNode {
    /**
     * 
     * @param {string} type 
     * @param {ASTNode|Token} node
     */
    constructor(type, node = null) {
        this.type = type
        this.children = []
        if (node) {
            this.push(node)
        }
    }
    /**
     * 
     * @param {ASTNode|Token} node 
     */
    push(node) {
        this.children.push(node)
    }
}

export class Parser {
    static builtinSyntaxDefine = [
        {
            regex: /\d*:\d*/,
            generator: (rule) => {
                // parseRange
                let start = 0
                let end = 5
                let step = 1

                let x = start
                let overflow = false
                let ready_overflow = false
                return {
                    overflow,
                    next: () => {
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
            }
        }
    ]

    constructor(custom = [], builtin = Parser.builtinSyntaxDefine) {
        /** @type {typeof Parser.builtinSyntax} */
        this.syntaxDefine = [...custom, ...builtin]
    }
    /**
     * 
     * @param {Token[]} tokens 
     */
    parse(tokens) {
        let ast = new ASTNode('root')
        for (let i in tokens) {
            let token = tokens[i]
            token.type
            token.raw
            ast.push(token.type, token.raw, token.pos)

        }

    }
}



export class Evaluator {
    static builtin = [
        {
            pattern: /\d*:\d*/,
            generator: (rule) => {
                // parseRange
                let start = 0
                let end = 5
                let step = 1

                let x = start
                let overflow = false
                let ready_overflow = false
                return {
                    overflow,
                    next: () => {
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
            }
        }
    ]
    /**
     * 
     * @param {Token} token 
     */
    constructor(token, expresses) {
        this.token
    }

    evaluate() {

    }
}


export class Interpreter {
    constructor() {
        this.blocks = {}
        this.values = {}
    }

    load(code, scope = 'main') {
        let tokens = new Lexer(code).tokenize();
        this.blocks[scope] = new Evaluator(tokens);
    }

    interpret() {
        for (let scope in this.blocks) {
            this.blocks[scope].evaluate()
            this.values[scope] = this.blocks[scope].render()
        }

        return this.values
    }
}
