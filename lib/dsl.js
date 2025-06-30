export class Token {
    constructor(type, rawText, pos) {
        this.type = type;
        this.rawText = rawText;
        this.pos = pos;
    }
}

export class Lexer {
    constructor(input, tagStart = '{', tagEnd = '}' ) {
        this.input = input;
        this.tagStart = tagStart;
        this.tagEnd = tagEnd;
        this.regex = new RegExp(`\\${this.tagStart}[^\\${this.tagStart}\\${this.tagEnd}]*\\${this.tagEnd}`, 'g');
    }

    // advance() {
    //     this.pos++;
    // }

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


        // let accept = 'tag';
        // for (let i = this.pos; i < this.input.length; i++) {
        //     const char = this.input[i];
        //     switch (accept) {
        //         case 'tag':
        //             if (char === '{') {
        //                 let buff = this.input.slice(this.pos, i);
        //                 tokens.push(new Token('raw', buff));
        //                 accept = 'name';
        //             }
        //             break;
        //         case 'name':

        //     }
        // }
    }
}

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }

    parse() {
        return this.parseExpression();
    }
}


export class ASTNode {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

export class AST {

}


export class Interpreter {
    constructor(ast) {
        this.ast = ast;
    }


    interpret() {
        return this.ast.evaluate();
    }
}
