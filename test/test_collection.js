// test/collection.test.js
import test from 'ava';
import { Counter, RotatingArray, LinkedList } from '../lib/collection.js';

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


test('LinkedList initialization', t => {
    const list = new LinkedList();
    t.is(list.head, null);
    t.is(list.tail, null);
    t.is(list.length, 0);
});

test('append()', t => {
    const list = new LinkedList();
    const node1 = list.append('A');

    t.is(list.head, node1);
    t.is(list.tail, node1);
    t.is(list.length, 1);

    const node2 = list.append('B');
    t.is(list.head.next, node2);
    t.is(node2.prev, node1);
    t.is(list.tail, node2);
    t.is(list.length, 2);
});

test('prepend()', t => {
    const list = new LinkedList();
    const node2 = list.prepend('B');

    t.is(list.head, node2);
    t.is(list.tail, node2);
    t.is(list.length, 1);

    const node1 = list.prepend('A');
    t.is(list.head, node1);
    t.is(node1.next, node2);
    t.is(node2.prev, node1);
    t.is(list.length, 2);
});

test('getNode()', t => {
    const list = new LinkedList();
    list.append('A');
    list.append('B');
    list.append('C');

    t.is(list.getNode(0).value, 'A');
    t.is(list.getNode(1).value, 'B');
    t.is(list.getNode(2).value, 'C');
    t.is(list.getNode(-1).value, 'C');
    t.is(list.getNode(-2).value, 'B');
    t.is(list.getNode(-3).value, 'A');
    t.is(list.getNode(5), null);
    t.is(list.getNode(-5), null);
});

test('remove()', t => {
    const list = new LinkedList();
    const nodeA = list.append('A');
    const nodeB = list.append('B');
    const nodeC = list.append('C');

    // 删除中间节点
    t.is(list.remove(nodeB), 'B');
    t.is(list.length, 2);
    t.is(nodeA.next, nodeC);
    t.is(nodeC.prev, nodeA);

    // 删除头节点
    t.is(list.remove(nodeA), 'A');
    t.is(list.head, nodeC);
    t.is(list.length, 1);

    // 删除尾节点
    t.is(list.remove(nodeC), 'C');
    t.is(list.head, null);
    t.is(list.tail, null);
    t.is(list.length, 0);

    // 错误类型测试
    const error = t.throws(() => list.remove('invalid'));
    t.true(error.message.includes('LinkedList.Node'));
});

test('forLimit()', t => {
    const list = new LinkedList();
    'ABCDE'.split('').forEach(c => list.append(c));

    // 正向遍历
    const forward = [];
    list.forLimit(3, value => forward.push(value));
    t.deepEqual(forward, ['A', 'B', 'C']);

    // 反向遍历
    const backward = [];
    list.forLimit(-2, value => backward.push(value));
    t.deepEqual(backward, ['D', 'E']);

    // 组合遍历
    const combined = [];
    list.forLimit([2, -3], value => combined.push(value));
    t.deepEqual(combined, ['A', 'B', 'C', 'D', 'E']);

    // 边界测试
    const empty = [];
    list.forLimit(0, () => empty.push('X'));
    t.is(empty.length, 0);

    const overflow = [];
    list.forLimit(10, value => overflow.push(value));
    t.deepEqual(overflow, ['A', 'B', 'C', 'D', 'E']);
});

test('iterator', t => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);

    const result = [];
    for (const value of list) {
        result.push(value);
    }

    t.deepEqual(result, [1, 2, 3]);
});

test('toString()', t => {
    const list = new LinkedList();
    t.is(list.toString(), '');

    list.append('X');
    t.is(list.toString(), 'X');

    list.append('Y');
    list.prepend('W');
    t.is(list.toString(), 'W <-> X <-> Y');
});

test('integration', t => {
    const list = new LinkedList();
    const node1 = list.prepend(10);
    const node2 = list.append(20);
    list.prepend(5);

    t.is(list.toString(), '5 <-> 10 <-> 20');
    t.is(list.getNode(1).value, 10);

    list.remove(node1);
    t.is(list.length, 2);
    t.is(list.head.value, 5);
    t.is(list.tail.value, 20);
});