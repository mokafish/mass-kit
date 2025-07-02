import util from 'util';
import test from 'ava';
import { Lexer, Parser, Interpreter } from './lib/dsl.js';

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

    let tokens = lexer.tokenize(
        `hello {"exec 2" #1 ^g:2 abc "x y z = 789"  x="\\{ 123 \\}" "y z"="4 5\ 6"}  world...`
    );

    let ast = parser.parse(tokens);
    t.snapshot(ast, 'dsl.Parser parse() #1');

    tokens = lexer.tokenize('.../q={xxx}&i={1:5}&s={ yyy }&d={"z\\"z}z"}');
    ast = parser.parse(tokens);
    t.snapshot(ast, 'dsl.Parser parse() #2');


    // t.log(ast)
    // t.log(ast);

    // t.is(parser, parser);
});

test('dsl.Parser syntax', async t => {
    t.timeout(10000); // Increase timeout for this test
    const lexer = new Lexer();
    const parser = new Parser();

    let tokens = lexer.tokenize('.../q={1:5}');
    let ast = parser.parse(tokens);
    t.is(ast.nodes[1].opcode, 'seq');
    t.deepEqual(ast.nodes[1].data, [1, 5, 1]);

    tokens = lexer.tokenize('.../q={1:5:-1}');
    ast = parser.parse(tokens);
    t.is(ast.nodes[1].opcode, 'seq');
    t.deepEqual(ast.nodes[1].data, [1, 5, -1]);

    tokens = lexer.tokenize('.../q={1:}');
    ast = parser.parse(tokens);
    t.is(ast.nodes[1].opcode, 'seq');
    t.deepEqual(ast.nodes[1].data, [1, Number.MAX_SAFE_INTEGER, 1]);

    tokens = lexer.tokenize('.../q={:20}');
    ast = parser.parse(tokens);
    t.is(ast.nodes[1].opcode, 'seq');
    t.deepEqual(ast.nodes[1].data, [0, 20, 1]);


});

test.only('dsl.Interpreter', async t => {
    const interpreter = new Interpreter();
    interpreter.load('.../q={:20}');
    t.log(interpreter);

    t.pass();
})