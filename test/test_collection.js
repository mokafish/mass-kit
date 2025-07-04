// test/collection.test.js
import test from 'ava';
import { Counter, RotatingArray } from '../lib/collection.js';

// 测试 Counter 类
test('Counter: constructor initializes empty', t => {
    const c = new Counter();
    t.is(c.get('any'), 0);
});

test('Counter: add new key', t => {
    const c = new Counter();
    t.is(c.add('key1'), 1);
    t.is(c.get('key1'), 1);
});

test('Counter: add existing key', t => {
    const c = new Counter();
    c.add('key1', 2);
    t.is(c.add('key1', 3), 5);
    t.is(c.get('key1'), 5);
});

test('Counter: add with default key (null)', t => {
    const c = new Counter();
    t.is(c.add(), 1);
    t.is(c.get(null), 1);
});

test('Counter: inc increments value', t => {
    const c = new Counter();
    c.inc('key1');
    t.is(c.get('key1'), 1);
    c.inc('key1');
    t.is(c.get('key1'), 2);
});

test('Counter: set overrides value', t => {
    const c = new Counter();
    c.set('key1', 5);
    t.is(c.get('key1'), 5);
    c.set('key1', 10);
    t.is(c.get('key1'), 10);
});

test('Counter: has checks key existence', t => {
    const c = new Counter();
    t.false(c.has('key1'));
    c.add('key1');
    t.true(c.has('key1'));
});

test('Counter: delete removes key', t => {
    const c = new Counter();
    c.add('key1');
    t.true(c.delete('key1'));
    t.false(c.has('key1'));
    t.is(c.get('key1'), 0);
});

test('Counter: clear resets counter', t => {
    const c = new Counter();
    c.add('key1');
    c.add('key2');
    c.clear();
    t.is(c.get('key1'), 0);
    t.is(c.get('key2'), 0);
    t.is(c.data.size, 0);
});

// 测试 RotatingArray 类
test('RotatingArray: constructor initializes correctly', t => {
    const arr = new RotatingArray(3, null);
    t.is(arr.length, 3);
    t.is(arr[0], null);
    t.is(arr[1], null);
    t.is(arr[2], null);
});

test('RotatingArray: get/set with positive indices', t => {
    const arr = new RotatingArray(3, 0);
    arr.set(0, 1);
    t.is(arr.get(0), 1);
    arr[1] = 2; // Proxy setter
    t.is(arr[1], 2); // Proxy getter
});

test('RotatingArray: get/set with negative indices', t => {
    const arr = new RotatingArray(3, 0);
    arr[0] = 1;
    arr[1] = 2;
    arr[2] = 3;
    t.is(arr.get(-1), 3); // last element
    t.is(arr.get(-2), 2); // second last
    t.is(arr[-3], 1); // Proxy handles negative
});

test('RotatingArray: push rotates buffer', t => {
    const arr = new RotatingArray(3, 0);
    // Initial: [0,0,0], cur=0
    arr.push(1); // Set index0=1, cur=(0+1)%3=1
    t.is(arr[0], 0); // (1+0+3)%3=1 → data[1]=0
    t.is(arr[1], 0); // (1+1+3)%3=2 → data[2]=0
    t.is(arr[2], 1); // (1+2+3)%3=0 → data[0]=1

    arr.push(2); // Set index0=2, cur=(1+1)%3=2
    t.is(arr[0], 0); // (2+0+3)%3=2 → data[2]=0
    t.is(arr[1], 1); // (2+1+3)%3=0 → data[0]=1
    t.is(arr[2], 2); // (2+2+3)%3=1 → data[1]=2

    arr.push(3); // Set index0=3, cur=(2+1)%3=0
    t.is(arr[0], 1); // (0+0+3)%3=0 → data[0]=1
    t.is(arr[1], 2); // (0+1+3)%3=1 → data[1]=2
    t.is(arr[2], 3); // (0+2+3)%3=2 → data[2]=3
});

test('RotatingArray: iteration with Symbol.iterator', t => {
    const arr = new RotatingArray(3, 0);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    t.deepEqual([...arr], [1, 2, 3]);

    arr.push(4);
    t.deepEqual([...arr], [2, 3, 4]);
});

test('RotatingArray: head returns first n elements', t => {
    const arr = new RotatingArray(3, 0);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    t.deepEqual(arr.head(2), [1, 2]);
    arr.push(4);
    t.deepEqual(arr.head(2), [2, 3]);
});

test('RotatingArray: tail returns last n elements', t => {
    const arr = new RotatingArray(3, 0);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    t.deepEqual(arr.tail(2), [2, 3]);
    arr.push(4);
    t.deepEqual(arr.tail(2), [3, 4]);
});

test('RotatingArray: handles length 0 correctly', t => {
    const arr = new RotatingArray(0, null);
    // 应安全处理无效操作
    t.notThrows(() => arr.push(1));
    t.is(arr.get(0), 1);
    t.deepEqual([...arr], []);
});

test('RotatingArray: non-numeric indices', t => {
    const arr = new RotatingArray(3, 0);
    arr.foo = 'bar'; // 非数字属性
    t.is(arr.foo, 'bar');
    t.is(arr.get('foo'), undefined); 
});