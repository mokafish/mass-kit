import { Lexer,Interpreter } from './lib/dsl.js';

// let lexer = new Lexer('{name} is {age} years old');
// lexer = new Lexer('{{name}} is age years {1} {old');
// let tokens = lexer.tokenize();
// console.log(tokens);

let itp = new Interpreter()
itp.load('{name} is {age} years 12/24 old')
console.log(itp.interpret());

