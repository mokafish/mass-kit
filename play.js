import { Lexer } from './lib/dsl.js';

let lexer = new Lexer('{name} is {age} years old');
lexer = new Lexer('{{name}} is age years {1} {old');
let tokens = lexer.tokenize();
console.log(tokens);
