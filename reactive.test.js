import { print, test } from './helper.js'

export const describe = ({
    reactive,
    isReactive,
    toRaw,
    markRaw,
    computed,
    ref,
    isRef,
    effect
}) => [
    test('reactive/Object', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        console.log('original', original, 'observed', observed)
        // expect(observed).not.toBe(original)
        print('observed !== original', observed !== original, true)
        // expect(isReactive(observed)).toBe(true)
        print('isReactive(observed)', isReactive(observed), true)
        // expect(isReactive(original)).toBe(false)
        print('isReactive(original)', isReactive(original), false)
        // get
        // expect(observed.foo).toBe(1)
        print('observed.foo', observed.foo, 1)
        // has
        // expect('foo' in observed).toBe(true)
        print('"foo" in observed', 'foo' in observed, true)
        // ownKeys
        // expect(Object.keys(observed)).toEqual(['foo'])
        print('Object.keys(observed)', Object.keys(observed), ['foo'], true)
    }),
    test('reactive/proto', () => {
        const obj = {}
        const reactiveObj = reactive(obj)
        console.log('obj', obj, 'reactiveObj', reactiveObj)
        // expect(isReactive(reactiveObj)).toBe(true)
        print('isReactive(reactiveObj)', isReactive(reactiveObj), true)
        const prototype = reactiveObj['__proto__']
        print('isReactive(prototype)', isReactive(prototype), false)
        const otherObj = { data: ['a'] }
        console.log('otherObj', otherObj)
        // expect(isReactive(otherObj)).toBe(false)
        print('isReactive(otherObj)', isReactive(otherObj), false)
        const reactiveOther = reactive(otherObj)
        console.log('reactiveOther', reactiveOther)
        // expect(isReactive(reactiveOther)).toBe(true)
        print('isReactive(reactiveOther)', isReactive(reactiveOther), true)
        print(
            'isReactive(reactiveOther.data)',
            isReactive(reactiveOther.data),
            true
        )
        // expect(reactiveOther.data[0]).toBe('a')
        print('reactiveOther.data[0]', reactiveOther.data[0], 'a')
    }),
    test('reactive/nested reactives', () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [{ bar: 2 }]
        }
        const observed = reactive(original)
        console.log('original', original, 'observed', observed)
        // expect(isReactive(observed.nested)).toBe(true)
        print('isReactive(observed.nested)', isReactive(observed.nested), true)
        // expect(isReactive(observed.array)).toBe(true)
        print('isReactive(observed.array)', isReactive(observed.array), true)
        // expect(isReactive(observed.array[0])).toBe(true)
        print(
            'isReactive(observed.array[0])',
            isReactive(observed.array[0]),
            true
        )
    }),
    test('reactive/observing subtypes of IterableCollections(Map, Set)', () => {
        // subtypes of Map
        class CustomMap extends Map {}
        const cmap = reactive(new CustomMap())

        // expect(cmap instanceof Map).toBe(true)
        print('cmap instanceof Map', cmap instanceof Map, true)
        // expect(isReactive(cmap)).toBe(true)
        print('isReactive(cmap)', isReactive(cmap), true)

        cmap.set('key', {})
        // expect(isReactive(cmap.get('key'))).toBe(true)
        print("isReactive(cmap.get('key'))", isReactive(cmap.get('key')), true)

        // subtypes of Set
        class CustomSet extends Set {}
        const cset = reactive(new CustomSet())

        // expect(cset instanceof Set).toBe(true)
        print('cset instanceof Set', cset instanceof Set, true)
        // expect(isReactive(cset)).toBe(true)
        print('isReactive(cset)', isReactive(cset), true)

        let dummy
        effect(() => (dummy = cset.has('value')))
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
        cset.add('value')
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
        cset.delete('value')
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
    }),
    test('reactive/observing subtypes of WeakCollections(WeakMap, WeakSet)', () => {
        // subtypes of WeakMap
        class CustomMap extends WeakMap {}
        const cmap = reactive(new CustomMap())

        // expect(cmap instanceof WeakMap).toBe(true)
        print('cmap instanceof WeakMap', cmap instanceof WeakMap, true)
        // expect(isReactive(cmap)).toBe(true)
        print('isReactive(cmap)', isReactive(cmap), true)

        const key = {}
        cmap.set(key, {})
        // expect(isReactive(cmap.get(key))).toBe(true)
        print('isReactive(cmap.get(key))', isReactive(cmap.get(key)), true)

        // subtypes of WeakSet
        class CustomSet extends WeakSet {}
        const cset = reactive(new CustomSet())

        // expect(cset instanceof WeakSet).toBe(true)
        print('cset instanceof WeakSet', cset instanceof WeakSet, true)
        // expect(isReactive(cset)).toBe(true)
        print('isReactive(cset)', isReactive(cset), true)

        let dummy
        effect(() => (dummy = cset.has(key)))
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
        cset.add(key)
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
        cset.delete(key)
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
        console.groupEnd()
    }),
    test('reactive/observed value should proxy mutations to original (Object)', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        console.log('original', original, 'observed', observed)
        // set
        observed.bar = 1
        // expect(observed.bar).toBe(1)
        print('observed.bar', observed.bar, 1)
        // expect(original.bar).toBe(1)
        print('original.bar', original.bar, 1)
        // delete
        delete observed.foo
        // expect('foo' in observed).toBe(false)
        print("'foo' in observed", 'foo' in observed, false)
        // expect('foo' in original).toBe(false)
        print("'foo' in original", 'foo' in original, false)
    }),
    test('reactive/setting a property with an unobserved value should wrap with reactive', () => {
        const observed = reactive({})
        const raw = {}
        console.log('observed', observed, 'raw', raw)
        observed.foo = raw
        // expect(observed.foo).not.toBe(raw)
        print('observed.foo', observed.foo, raw)
        // expect(isReactive(observed.foo)).toBe(true)
        print('isReactive(observed.foo)', isReactive(observed.foo), true)
    }),
    test('reactive/observing already observed value should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(observed)
        console.log(
            'original',
            original,
            'observed',
            observed,
            'observed2',
            observed2
        )
        // expect(observed2).toBe(observed)
        print('observed2', observed2, observed)
        console.groupEnd()
    }),
    test('reactive/observing the same value multiple times should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(original)
        console.log(
            'original',
            original,
            'observed',
            observed,
            'observed2',
            observed2
        )
        // expect(observed2).toBe(observed)
        print('observed2', observed2, observed)
        console.groupEnd()
    }),
    test('reactive/should not pollute original object with Proxies', () => {
        const original = { foo: 1 }
        const original2 = { bar: 2 }
        const observed = reactive(original)
        const observed2 = reactive(original2)
        console.log(
            'original',
            original,
            'original2',
            original2,
            'observed',
            observed,
            'observed2',
            observed2
        )
        observed.bar = observed2
        // expect(observed.bar).toBe(observed2)
        print('observed.bar', observed.bar, observed2)
        // expect(original.bar).toBe(original2)
        print('original.bar', original.bar, original2)
        console.groupEnd()
    }),
    test('reactive/toRaw', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        console.log('original', original, 'observed', observed)
        // expect(toRaw(observed)).toBe(original)
        print('toRaw(observed)', toRaw(observed), original)
        // expect(toRaw(original)).toBe(original)
        print('toRaw(original)', toRaw(original), original)
        console.groupEnd()
    }),
    test('reactive/toRaw on object using reactive as prototype', () => {
        const original = reactive({})
        const obj = Object.create(original)
        const raw = toRaw(obj)
        console.log('original', original, 'obj', obj, 'raw', raw)
        // expect(raw).toBe(obj)
        print('raw', raw, obj)
        // expect(raw).not.toBe(toRaw(original))
        print('raw', raw, toRaw(original))
        console.groupEnd()
    }),
    test('reactive/should not unwrap Ref<T>', () => {
        const observedNumberRef = reactive(ref(1))
        const observedObjectRef = reactive(ref({ foo: 1 }))

        console.log(
            'observedNumberRef.value',
            observedNumberRef.value,
            'observedObjectRef.value',
            observedObjectRef.value
        )
        // expect(isRef(observedNumberRef)).toBe(true)
        print('isRef(observedNumberRef)', isRef(observedNumberRef), true)
        // expect(isRef(observedObjectRef)).toBe(true)
        print('isRef(observedObjectRef)', isRef(observedObjectRef), true)
        const obj = reactive({ a: ref(2) })
        console.log(obj, obj.a)
        console.groupEnd()
    }),
    test('reactive/should unwrap computed refs', () => {
        // readonly
        const a = computed(() => 1)
        // writable
        const b = computed({
            get: () => 1,
            set: async () => {}
        })
        const obj = reactive({ a, b })
        console.log('a.value', a.value, 'b.value', b.value, 'obj', obj)
        // check type
        obj.a + 1
        obj.b + 1
        // expect(typeof obj.a).toBe(`number`)
        print('typeof obj.a', typeof obj.a, 'number')
        // expect(typeof obj.b).toBe(`number`)
        print('typeof obj.b', typeof obj.b, 'number')
        console.groupEnd()
    }),
    test('reactive/should allow setting property from a ref to another ref', () => {
        const foo = ref(0)
        const bar = ref(1)
        const observed = reactive({ a: foo })
        const dummy = computed(() => observed.a)
        console.log(
            'foo.value',
            foo.value,
            'bar.value',
            bar.value,
            'observed',
            observed,
            'dummy.value',
            dummy.value
        )
        // expect(dummy.value).toBe(0)
        print('dummy.value', dummy.value, 0)
        observed.a = bar
        // expect(dummy.value).toBe(1)
        print('dummy.value', dummy.value, 1)
        bar.value++
        // expect(dummy.value).toBe(2)
        print('dummy.value', dummy.value, 2)
        console.groupEnd()
    }),
    test('reactive/non-observable values', () => {
        // const assertValue = value => {
        //     reactive(value)
        //     expect(
        //         `value cannot be made reactive: ${String(value)}`
        //     ).toHaveBeenWarnedLast()
        // }

        // number
        // assertValue(1)
        print('reactive(1)', reactive(1), 1, true)
        // string
        // assertValue('foo')
        print("reactive('foo')", reactive('foo'), 'foo', true)
        // boolean
        // assertValue(false)
        print('reactive(false)', reactive(false), false, true)
        // null
        // assertValue(null)
        print('reactive(null)', reactive(null), null, true)
        // undefined
        // assertValue(undefined)
        print('reactive(undefined)', reactive(undefined), undefined, true)
        // symbol
        const s = Symbol()
        // assertValue(s)
        print('reactive(s)', reactive(s), s, true)

        // built-ins should work and return same value
        const p = Promise.resolve()
        // expect(reactive(p)).toBe(p)
        print('reactive(p)', reactive(p), p)
        const r = new RegExp('')
        // expect(reactive(r)).toBe(r)
        print('reactive(r)', reactive(r), r)
        const d = new Date()
        // expect(reactive(d)).toBe(d)
        print('reactive(d)', reactive(d), d)
        console.groupEnd()
    }),
    test('reactive/markRaw', () => {
        const obj = reactive({
            foo: { a: 1 },
            bar: markRaw({ b: 2 })
        })
        console.log('obj', obj)
        // expect(isReactive(obj.foo)).toBe(true)
        print('isReactive(obj.foo)', isReactive(obj.foo), true)
        // expect(isReactive(obj.bar)).toBe(false)
        print('isReactive(obj.bar)', isReactive(obj.bar), false)
        console.groupEnd()
    }),
    test('reactive/should not observe non-extensible objects', () => {
        const obj = reactive({
            foo: Object.preventExtensions({ a: 1 }),
            // sealed or frozen objects are considered non-extensible as well
            bar: Object.freeze({ a: 1 }),
            baz: Object.seal({ a: 1 })
        })
        console.log('obj', obj)
        // expect(isReactive(obj.foo)).toBe(false)
        print('isReactive(obj.foo)', isReactive(obj.foo), false)
        // expect(isReactive(obj.bar)).toBe(false)
        print('isReactive(obj.bar)', isReactive(obj.bar), false)
        // expect(isReactive(obj.baz)).toBe(false)
        print('isReactive(obj.baz)', isReactive(obj.baz), false)
        console.groupEnd()
    }),
    test('reactive/should not observe objects with __v_skip', () => {
        const original = {
            foo: 1,
            __v_skip: true
        }
        const observed = reactive(original)
        // expect(isReactive(observed)).toBe(false)
        console.log('original', original, 'observed', observed)
        print('isReactive(observed)', isReactive(observed), false)
        console.groupEnd()
    })
]
