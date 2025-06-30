export class Token {
    /**
     * 
     * @param {string} type 
     * @param {string} raw 
     * @param {number} pos 
     */
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
    constructor(tagStart = '{', tagEnd = '}') {
        this.tagStart = tagStart;
        this.tagEnd = tagEnd;
        this.regex = new RegExp(`\\${this.tagStart}[^\\${this.tagStart}\\${this.tagEnd}]*\\${this.tagEnd}`, 'g');
    }

    tokenize(input) {
        const tokens = [];
        let match;
        let pos = 0;
        while ((match = this.regex.exec(input)) !== null) {
            // 处理匹配前的文本
            const textBefore = input.slice(pos, match.index);
            if (textBefore.length > 0) {
                tokens.push(new Token('text', textBefore, pos));
            }
            // 处理占位符
            const tag = match[0].slice(1, -1);
            tokens.push(new Token('tag', tag, match.index));
            pos = match.index + match[0].length;
        }

        // 处理剩余的文本
        const textAfter = input.slice(pos);
        if (textAfter.length > 0) {
            tokens.push(new Token('text', textAfter, pos));
        }

        return tokens;
    }
}

export class Node {
    constructor(name, body, attr = {}) {
        this.name = name
        this.body = body
        this.attr = attr
    }
}


export class AST {
    constructor() {
        // this.syntaxs
        /** @type {Node[]} */
        this.table = []
    }

    addNode(node) {
        this.table.push(node)
    }
}

// export class ASTNode {
//     /**
//      * 
//      * @param {string} type 
//      * @param {ASTNode|Token} node
//      */
//     constructor(type, node = null, pos = 0) {
//         this.type = type
//         this.children = []
//         if (node) { 
//             this.push(node, pos)
//         }
//     }
//     /**
//      * 
//      * @param {ASTNode|Token} node 
//      */
//     push(node, pos = 0) {
//         this.children.push(node)
//     }
// }

export class Parser {
    static builtinTagDefinitions = [
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

    // static builtinAttrDefinitions = [
    //     {
    //         regex: /([^\s\=]+)=(\S*)/,
    //         to: (k, v) => {

    //         }
    //     }
    // ]

    // constructor(custom = [], builtin = Parser.builtinTagDefinitions) {
    //     /** @type {typeof Parser.builtinTagDefinitions} */
    //     this.tagDefinitions = [...custom, ...builtin]

    // }

    constructor(tagPreProcess = [], attrPreProcess = []) {
        this.tagPreProcess = tagPreProcess
        this.attrPreProcess = attrPreProcess
    }

    /**
     * 
     * @param {Token[]} tokens 
     */
    parse(tokens) {
        let ast = new AST()
        for (let i in tokens) {
            let token = tokens[i]
            let node
            if (token.type == 'text') {
                node = new Node('text', token.raw)
            }
            if (token.type == 'tag') {
                // try {}
                node = this.parseTag(token)

            }
            ast.addNode(node)

        }

        return ast
    }

    /**
     * 
     * @param {Token} token 
     * @returns {Node}
     */
    parseTag(token) {
        let tag
        let remain
        for (let tp of this.tagPreProcess) {
            let match = tp.regex.exec(token.raw)
            if (match) {
                match[0]
                match.slice(1)
                remain = token.raw.slice(match[0].length)
                tag = tp.proc({ fullmatch: match[0], remain }, ...match.slice(1))
                break;
            }
        }

        let node
        if (tag) {
            if (!tag.attr) {
                tag.attr = remain.split('\s*')
            }
            tag.attrObject = this.parseAttr(tag.attr)
            node = new Node(tag.name, tag.body, tag.attrObject)

        } else {
            node = new Node('unknown', token.raw)
        }

        return node

        // let syntax = token.raw.split(/\s+/)
        // let tag = syntax[0]
        // let attr = {}
        // for (let i = 1; i < syntax.length; i++) {
        //     let [k, v] = this.parseAttr(syntax[1])
        //     attr[k] = v
        // }

    }
    /**
     * 
     * @param {string[]} attrArray 
     * @returns {object}
     */
    parseAttr(attrArray) {

        return {}
    }
}



export class Evaluator {
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

export const builtinTagPreProcess = [
    {
        regex: /([\-\+\d]*):([\-\+\d]*)(?::([\-\+\d]*))?/,
        proc: (_, start, end, step) => {
            return { name: 'seq', body: { start, end, step } }
        }
    }
]

export class Interpreter {
    constructor() {
        this.scope = {}
        this.lexer = new Lexer()
        this.parser = new Parser(builtinTagPreProcess)
    }

    load(code, scopeName = 'main') {
        let tokens = this.lexer.tokenize(code)
        let ast = this.parser.parse(tokens)
        this.scope[scopeName] = {
            scope: scopeName,
            ast: ast,

        }
    }

    interpret(scopeName = undefined) {
        if(scopeName){
            return this.scope[scopeName].ast.table
        }

        let res = {}
        for(let name in  this.scope){
            res[name] = this.interpret(name)
        } 
        return res
    }
}





export class Interpreter2 {
    constructor() {
        this.blocks = {}
        this.values = {}
    }

    load(code, scope = 'main') {
        let tokens = new Lexer(code).tokenize(code);
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
