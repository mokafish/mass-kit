import test from 'ava';
import {Lexer} from './lib/dsl.js';

test('foo', t => {
	t.pass();
});

test('dsl.Lexer', async t => {
    const lexer = new Lexer();
    const tokens = lexer.tokenize(
        `hello {exec abc "x y z"} ... , {"exec 2" 'ab\\'c' x="\\{ 123 \\}"} world...`
    );
   
    console.log(tokens);
    
    t.is(lexer, lexer);
});