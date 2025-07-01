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
    }
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
        this.text_table = []
        this.ins_table = []
        this.ref_table = []
        this.ordered_table = []
    }

    /**
     * 
     * @param {Node} node 
     */
    addNode(node) {
        this.table.push(node)

        if (node.name == 'text') {
            this.text_table.push(node)
        } else if (node.name == 'ref') {
            this.ref_table.push(node)
        } else {
            this.ins_table.push(node)
        }
    }

    arrange() {
        this.ordered_table = [...this.text_table, ...this.ref_table, ...this.ins_table]
    }
}


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
                tag.attr = remain.split(/\s+/)
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
        let attrObject = {}
        for (let attr of attrArray) {
            console.log(attr);

            if (!attr) continue;
            for (let ap of this.attrPreProcess) {
                let match = ap.regex.exec(attr)
                if (match) {
                    // let [k, v] = ap.proc(match[0], ...match.slice(1))
                    let [k, v] = ap.proc(...match)
                    attrObject[k] = v
                    break;
                }
            }
        }

        return attrObject
    }
}



export class Evaluator {

    constructor() {
        this.context = {}
    }

    createContext(scope, ast) {
        this.context[scope] = {
            ast,
            env: {}
        }
    }

    /**
     * 
     * @param {Node} node 
     */
    evaluate(node) {

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


export const builtinAttrPreProcess = [
    {
        // regex: /\^([\w\:]+)/,
        regex: /\^(\d+)/,
        proc: (_, id) => ['low', Number(id)]
    },
    {
        regex: /\#(\w+)/,
        proc: (_, id) => ['id', id]
    },
    {
        regex: /([^\s\=]+)(?:\=(\S*))?/,
        // regex: /([^\s\=]*)\=(\S*)/,
        proc: (_, name, value) => [name, value || true]
    }
]

export class Interpreter {
    constructor() {
        // this.scope = {}
        this.lexer = new Lexer()
        this.parser = new Parser(builtinTagPreProcess, builtinAttrPreProcess)
        this.evaluator = new Evaluator()
    }

    load(code, scope = 'main') {
        let tokens = this.lexer.tokenize(code)
        let ast = this.parser.parse(tokens)
        this.evaluator.createContext(scope, ast)
    }

    interpret(scope = undefined) {
        if (scope) {
            return this.evaluator.evaluate()
        }

        let res = {}
        for (let scope in this.evaluator.context) {
            res[scope] = this.interpret(scope)
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
