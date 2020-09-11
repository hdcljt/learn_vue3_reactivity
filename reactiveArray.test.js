import { print, test } from './helper.js'

export const describe = ({
    reactive,
    isReactive,
    toRaw,
    ref,
    isRef,
    effect
}) => [
    test('should make Array reactive', () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        console.log('original', original, 'observed', observed)
        // expect(observed).not.toBe(original)
        print('observed !== original', observed !== original, true)
        // expect(isReactive(observed)).toBe(true)
        print('isReactive(observed)', isReactive(observed), true)
        // expect(isReactive(original)).toBe(false)
        print('isReactive(original)', isReactive(original), false)
        // expect(isReactive(observed[0])).toBe(true)
        print('isReactive(observed[0])', isReactive(observed[0]), true)
        // get
        // expect(observed[0].foo).toBe(1)
        print('observed[0].foo', observed[0].foo, 1)
        // has
        // expect(0 in observed).toBe(true)
        print('0 in observed', 0 in observed, true)
        // ownKeys
        // expect(Object.keys(observed)).toEqual(['0'])
        print('Object.keys(observed)', Object.keys(observed), ['0'], true)
    }),
    test('cloned reactive Array should point to observed values', () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        const clone = observed.slice()
        console.log('original', original, 'observed', observed, 'clone', clone)
        // expect(isReactive(clone[0])).toBe(true)
        print('isReactive(clone[0])', isReactive(clone[0]), true)
        // expect(clone[0]).not.toBe(original[0])
        print('clone[0]', clone[0], original[0])
        // expect(clone[0]).toBe(observed[0])
        print('clone[0]', clone[0], observed[0])
    }),
    test('observed value should proxy mutations to original (Array)', () => {
        const original = [{ foo: 1 }, { bar: 2 }]
        const observed = reactive(original)
        // set
        const value = { baz: 3 }
        const reactiveValue = reactive(value)
        console.log(
            'original',
            original,
            'observed',
            observed,
            'value',
            value,
            'reactiveValue',
            reactiveValue
        )
        observed[0] = value
        // expect(observed[0]).toBe(reactiveValue)
        print('observed[0]', observed[0], reactiveValue)
        // expect(original[0]).toBe(value)
        print('original[0]', original[0], value)
        // delete
        delete observed[0]
        // expect(observed[0]).toBeUndefined()
        print('observed[0]', observed[0], undefined)
        // expect(original[0]).toBeUndefined()
        print('original[0]', original[0], undefined)
        // mutating methods
        observed.push(value)
        // expect(observed[2]).toBe(reactiveValue)
        print('observed[2]', observed[2], reactiveValue)
        // expect(original[2]).toBe(value)
        print('original[2]', original[2], value)
    }),
    test('Array identity methods should work with raw values', () => {
        const raw = {}
        const arr = reactive([{}, {}])
        console.log('raw', raw, 'arr', arr)
        arr.push(raw)
        // expect(arr.indexOf(raw)).toBe(2)
        print('arr.indexOf(raw)', arr.indexOf(raw), 2)
        // expect(arr.indexOf(raw, 3)).toBe(-1)
        print('arr.indexOf(raw, 3)', arr.indexOf(raw, 3), -1)
        // expect(arr.includes(raw)).toBe(true)
        print('arr.includes(raw)', arr.includes(raw), true)
        // expect(arr.includes(raw, 3)).toBe(false)
        print('arr.includes(raw, 3)', arr.includes(raw, 3), false)
        // expect(arr.lastIndexOf(raw)).toBe(2)
        print('arr.lastIndexOf(raw)', arr.lastIndexOf(raw), 2)
        // expect(arr.lastIndexOf(raw, 1)).toBe(-1)
        print('arr.lastIndexOf(raw, 1)', arr.lastIndexOf(raw, 1), -1)

        // should work also for the observed version
        const observed = arr[2]
        // expect(arr.indexOf(observed)).toBe(2)
        print('arr.indexOf(observed)', arr.indexOf(observed), 2)
        // expect(arr.indexOf(observed, 3)).toBe(-1)
        print('arr.indexOf(observed, 3)', arr.indexOf(observed, 3), -1)
        // expect(arr.includes(observed)).toBe(true)
        print('arr.includes(observed)', arr.includes(observed), true)
        // expect(arr.includes(observed, 3)).toBe(false)
        print('arr.includes(observed, 3)', arr.includes(observed, 3), false)
        // expect(arr.lastIndexOf(observed)).toBe(2)
        print('arr.lastIndexOf(observed)', arr.lastIndexOf(observed), 2)
        // expect(arr.lastIndexOf(observed, 1)).toBe(-1)
        print('arr.lastIndexOf(observed, 1)', arr.lastIndexOf(observed, 1), -1)
    }),
    test('Array identity methods should work if raw value contains reactive objects', () => {
        const raw = []
        const obj = reactive({})
        raw.push(obj)
        const arr = reactive(raw)
        console.log('raw', raw, 'obj', obj, 'arr', arr)
        // expect(arr.includes(obj)).toBe(true)
        print('arr.includes(obj)', arr.includes(obj), true)
    }),
    test('Array identity methods should be reactive', () => {
        const obj = {}
        const arr = reactive([obj, {}])
        console.log('obj', obj, 'arr', arr)
        let index = -1
        effect(() => {
            index = arr.indexOf(obj)
        })
        // expect(index).toBe(0)
        print('index', index, 0)
        arr.reverse()
        // expect(index).toBe(1)
        print('index', index, 1)
    }),
    test('delete on Array should not trigger length dependency', () => {
        const arr = reactive([1, 2, 3])
        console.log('arr', arr)
        // const fn = jest.fn()
        let haveBeenCalledTimes = 0
        effect(() => {
            // fn(arr.length)
            haveBeenCalledTimes++
            arr.length
        })
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        delete arr[1]
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    test('add existing index on Array should not trigger length dependency', () => {
        const array = new Array(3)
        const observed = reactive(array)
        console.log('array', array, 'observed', observed)
        // const fn = jest.fn()
        let haveBeenCalledTimes = 0
        effect(() => {
            // fn(observed.length)
            haveBeenCalledTimes++
            observed.length
        })
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        observed[1] = 1
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    test('add non-integer prop on Array should not trigger length dependency', () => {
        const array = new Array(3)
        const observed = reactive(array)
        console.log('array', array, 'observed', observed)
        // const fn = jest.fn()
        let haveBeenCalledTimes = 0
        effect(() => {
            // fn(observed.length)
            haveBeenCalledTimes++
            observed.length
        })
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        observed.x = 'x'
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        observed[-1] = 'x'
        // expect(fn).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    // read + copy
    test('[Array methods w/ refs] read only copy methods', () => {
        const original = reactive([1, ref(2)])
        const res = original.concat([3, ref(4)])
        const raw = toRaw(res)
        console.log('original', original, 'res', res, 'raw', raw)
        // expect(isRef(raw[1])).toBe(true)
        print('isRef(raw[1])', isRef(raw[1]), true)
        // expect(isRef(raw[3])).toBe(true)
        print('isRef(raw[3])', isRef(raw[3]), true)
    }),
    // read + write
    test('[Array methods w/ refs] read + write mutating methods', () => {
        const original = reactive([1, ref(2)])
        const res = original.copyWithin(0, 1, 2)
        const raw = toRaw(res)
        console.log('original', original, 'res', res, 'raw', raw)
        // expect(isRef(raw[0])).toBe(true)
        print('isRef(raw[0])', isRef(raw[0]), true)
        // expect(isRef(raw[1])).toBe(true)
        print('isRef(raw[1])', isRef(raw[1]), true)
    }),
    test('[Array methods w/ refs] read + identity', () => {
        const original = reactive([1, ref(2)])
        {
            const ref = original[1]
            console.log('original', original, 'ref', ref)
            // expect(ref).toBe(toRaw(original)[1])
            print('ref', ref, toRaw(original)[1])
            // expect(original.indexOf(ref)).toBe(1)
            print('original.indexOf(ref)', original.indexOf(ref), 1)
        }
    })
]
