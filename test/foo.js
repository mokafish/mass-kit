import test from 'ava';
import * as play from '../play.js'

test('foo', t => {
    t.like({ a: 1, b: 2, c: 1 }, { a: 1, b: 2 });
});

test('bar', t => {
    t.true(play)
})
