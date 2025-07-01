import util from 'util';
import test from 'ava';
import { Lexer, Parser } from './lib/dsl.js';

util.inspect.defaultOptions.depth = 5;  // Increase AVA's printing depth

test('foo', t => {
    t.pass();
});

test('dsl.Lexer', async t => {
    const lexer = new Lexer();
    const tokens = lexer.tokenize(
        `hello {exec abc "x y z"} ... , {"exec 2" 'ab\\'c' x="\\{ 123 \\}"} world...`
    );

    // t.log(tokens);

    t.is(lexer, lexer);
});

test('dsl.Parser parse()', async t => {
    const lexer = new Lexer();
    const parser = new Parser();

    const tokens = lexer.tokenize(
        `hello {"exec 2" #1 ^g:2 abc "x y z = 789"  x="\\{ 123 \\}" "y z"="4 5\ 6"}  world...`
    );

    const ast = parser.parse(tokens);

    // t.log(ast);

    t.is(parser, parser);
});

test.only('dsl.Parser syntax', async t => {
    const lexer = new Lexer();
    const parser = new Parser();

    let tokens = lexer.tokenize('.../q={1:5}');
    let ast = parser.parse(tokens);
    let _ins = ['seq', '1', '5'];
    t.deepEqual(ast.nodes[1].ins.slice(0, _ins.length), _ins);

    tokens = lexer.tokenize('.../q={1:5:-1}');
    ast = parser.parse(tokens);
    _ins = ['seq', '1', '5','-1'];
    t.deepEqual(ast.nodes[1].ins.slice(0, _ins.length), _ins);

    tokens = lexer.tokenize('.../q={1:}');
    ast = parser.parse(tokens);
    _ins = ['seq', '1'];
    t.deepEqual(ast.nodes[1].ins.slice(0, _ins.length), _ins);


});