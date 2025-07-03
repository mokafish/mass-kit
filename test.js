import util from 'util';
import test from 'ava';
import { Lexer, Parser, Interpreter } from './lib/dsl.js';
import { topologicalSort } from './lib/helper.js';

util.inspect.defaultOptions.depth = 5;  // Increase AVA's printing depth

test('foo', t => {
    t.like({ a: 1, b: 2, c: 1 }, { a: 1, b: 2 });
});

test('dsl.Lexer', async t => {
    const lexer = new Lexer();
    const tokens = lexer.tokenize(
        `hello {exec abc "x y z"} ... , {"exec 2" 'ab\\'c' x="\\{ 123 \\}"} world...`
    );

    t.snapshot(tokens, 'dsl.Lexer #1');


    t.is(lexer, lexer);
});

test('dsl.Parser - this.parse()', async t => {
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

test('dsl.Parser - syntax', async t => {
    t.timeout(10000); // Increase timeout for this test
    const lexer = new Lexer();
    const parser = new Parser();

    let tokens = lexer.tokenize('.../q={1:5}');
    let ast = parser.parse(tokens);
    t.is(ast[1].opcode, 'seq');
    t.deepEqual(ast[1].data, [1, 5, 1]);

    tokens = lexer.tokenize('.../q={1:5:-1}');
    ast = parser.parse(tokens);
    t.is(ast[1].opcode, 'seq');
    t.deepEqual(ast[1].data, [1, 5, -1]);

    tokens = lexer.tokenize('.../q={1:}');
    ast = parser.parse(tokens);
    t.is(ast[1].opcode, 'seq');
    t.deepEqual(ast[1].data, [1, Number.MAX_SAFE_INTEGER, 1]);

    tokens = lexer.tokenize('.../q={:20}');
    ast = parser.parse(tokens);
    t.is(ast[1].opcode, 'seq');
    t.deepEqual(ast[1].data, [0, 20, 1]);


});

test('dsl.Parser - preprocess', async t => {
    const parser = new Parser();
    let ast = parser.parse('... q={:5 ^1 #apple} w={#doc:7} e={#3} r={20:30 ^doc:9}', 'main');
    // t.log(ast);
    t.pass();
})

test('dsl.Interpreter', async t => {
    const interpreter = new Interpreter();
    interpreter.load('... q={:5} w={#0} e={#3} r={20:30}');
    interpreter.ready();
    // t.log(interpreter.runtime.heap);
    let o;
    for (let i = 0; i < 15; i++) {
        o = interpreter.interpret();
        t.log(`${i}`.padStart(2), o.main);
    }


    t.pass();
})

test('dsl.Interpreter - throw if unhoped loading', async t => {
    let interpreter = new Interpreter();
    interpreter.load('... q={:5}');
    interpreter.ready();
    t.throws(() => {
        interpreter.load('... q={:20}', 'doc');
    }, { message: 'Interpreter is readied. Stop load inputs.' });
})

test('dsl.Interpreter - throw if circular reference', async t => {
    let interpreter = new Interpreter();
    interpreter.load('... q={:5 ^1} w={20: ^2} e={3:9 ^0}');
    t.throws(() => {
        interpreter.ready();
    }, { instanceOf: Interpreter.InterpreterError, message: 'Circular references exist between tags.' });
})


test('helper.topologicalSort()', t => {
    const items = [
        { id: 'apple', direction: null },
        { id: 'Banana', direction: 'Elderberry' },
        { id: 'Cherry', direction: 'Banana' },
        { id: 'Dragon fruit', direction: 'Banana' },
        { id: 'Elderberry', direction: null },
    ]

    const expected = [
        { id: 'apple', direction: null, },
        { id: 'Elderberry', direction: null, },
        { id: 'Banana', direction: 'Elderberry', },
        { id: 'Cherry', direction: 'Banana', },
        { id: 'Dragon fruit', direction: 'Banana', },
    ]

    const sorted = topologicalSort(items);

    // t.log(sorted);
    t.deepEqual(sorted, expected, 'topologicalSort should return items in correct order');
});