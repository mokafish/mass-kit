// test/generator.test.js
import test from 'ava';
import {
    seq,
    rand,
    choose,
    chooseFromFile,
    randText
} from '../lib/generator.js';

// 测试 seq 函数
test('seq: basic sequence with step 1', t => {
    const next = seq(1, 3);
    t.deepEqual(next(), { value: 1, overflow: false });
    t.deepEqual(next(), { value: 2, overflow: false });
    t.deepEqual(next(), { value: 3, overflow: false });
    t.deepEqual(next(), { value: 1, overflow: true });  // 重置后首次返回起点
});

test.skip('seq: step larger than range', t => {
    const next = seq(1, 5, 10);
    t.deepEqual(next(), { value: 1, overflow: false });
    t.deepEqual(next(), { value: 1, overflow: true });  // 立即重置
});


// 测试 rand 函数
test('rand: without countdown', t => {
    const next = rand(5, 10);
    const results = Array.from({ length: 100 }, next);

    // 验证所有值都在范围内
    t.true(results.every(({ value }) => value >= 5 && value <= 10));

    // 验证 overflow 始终为 true
    t.true(results.every(({ overflow }) => overflow));
});

test('rand: with countdown', t => {
    const next = rand(1, 3, 3);
    const results = [
        next(), // #1 overflow=true (count=3)
        next(), // #2 overflow=false (count=2)
        next(), // #3 overflow=false (count=1)
        next(), // #4 overflow=true (count reset to 3)
    ];

    t.is(results[0].overflow, true);
    t.is(results[1].overflow, false);
    t.is(results[2].overflow, false);
    t.is(results[3].overflow, true);
});

// 测试 choose 函数
test('choose: orderly selection', t => {
    const next = choose(['A', 'B', 'C'], true);
    t.deepEqual(next(), { value: 'A', overflow: false });
    t.deepEqual(next(), { value: 'B', overflow: false });
    t.deepEqual(next(), { value: 'C', overflow: false });
    t.deepEqual(next(), { value: 'A', overflow: true }); // 循环后首次返回起点
});

test('choose: random selection', t => {
    const options = ['X', 'Y', 'Z'];
    const next = choose(options, false);

    // 验证100次选择都在选项范围内
    for (let i = 0; i < 100; i++) {
        const { value } = next();
        t.true(options.includes(value));
    }
});

test('choose: handles empty values', t => {
    const next = choose(['  ', '\t', 'valid'], true);
    t.deepEqual(next(), { value: 'valid', overflow: false });
    t.deepEqual(next(), { value: 'valid', overflow: true }); // 单元素循环
});

// 测试 randText 函数
test('randText: generates valid strings', t => {
    const chars = 'ABC123';
    const next = randText(chars, 3, 5);

    for (let i = 0; i < 50; i++) {
        const { value, overflow } = next();
        // 验证长度
        t.true(value.length >= 3 && value.length <= 5);
        // 验证字符
        t.true([...value].every(c => chars.includes(c)));
        // 验证 overflow
        t.true(overflow);
    }
});
