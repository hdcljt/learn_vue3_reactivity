import { print, test } from './helper.js'

const TrackOpTypes = {
    GET: 'get',
    HAS: 'has',
    ITERATE: 'iterate'
}

const TriggerOpTypes = {
    SET: 'set',
    ADD: 'add',
    DELETE: 'delete',
    CLEAR: 'clear'
}

export const describe = ({
    reactive,
    effect,
    stop,
    toRaw,
    markRaw,
    ITERATE_KEY
}) => [
    test('should run the passed function once (wrapped by a effect)', () => {
        // const fnSpy = jest.fn(() => {})
        // effect(fnSpy)
        // expect(fnSpy).toHaveBeenCalledTimes(1)
        let haveBeenCalledTimes = 0
        effect(() => {
            haveBeenCalledTimes++
        })
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    test('should observe basic properties', () => {
        let dummy
        const counter = reactive({ num: 0 })
        effect(() => (dummy = counter.num))
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        counter.num = 7
        // expect(dummy).toBe(7)
        print('dummy', dummy, 7)
    }),
    test('should observe multiple properties', () => {
        let dummy
        const counter = reactive({ num1: 0, num2: 0 })
        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        counter.num1 = counter.num2 = 7
        // expect(dummy).toBe(21)
        print('dummy', dummy, 21)
    }),
    test('should handle multiple effects', () => {
        let dummy1, dummy2
        const counter = reactive({ num: 0 })
        effect(() => (dummy1 = counter.num))
        effect(() => (dummy2 = counter.num))
        // expect(dummy1).toBe(0)
        // expect(dummy2).toBe(0)
        print('dummy1', dummy1, 0)
        print('dummy2', dummy2, 0)
        counter.num++
        // expect(dummy1).toBe(1)
        // expect(dummy2).toBe(1)
        print('dummy1', dummy1, 1)
        print('dummy2', dummy2, 1)
    }),
    test('should observe nested properties', () => {
        let dummy
        const counter = reactive({ nested: { num: 0 } })
        effect(() => (dummy = counter.nested.num))
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        counter.nested.num = 8
        // expect(dummy).toBe(8)
        print('dummy', dummy, 8)
    }),
    test('should observe delete operations', () => {
        let dummy
        const obj = reactive({ prop: 'value' })
        effect(() => (dummy = obj.prop))
        // expect(dummy).toBe('value')
        print('dummy', dummy, 'value')
        delete obj.prop
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
    }),
    test('should observe has operations', () => {
        let dummy
        const obj = reactive({ prop: 'value' })
        effect(() => (dummy = 'prop' in obj))
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
        delete obj.prop
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
        obj.prop = 12
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
    }),
    test('should observe properties on the prototype chain', () => {
        let dummy
        const counter = reactive({ num: 0 })
        const parentCounter = reactive({ num: 2 })
        Object.setPrototypeOf(counter, parentCounter)
        effect(() => (dummy = counter.num))
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        delete counter.num
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        parentCounter.num = 4
        // expect(dummy).toBe(4)
        print('dummy', dummy, 4)
        counter.num = 3
        // expect(dummy).toBe(3)
        print('dummy', dummy, 3)
    }),
    test('should observe has operations on the prototype chain', () => {
        let dummy
        const counter = reactive({ num: 0 })
        const parentCounter = reactive({ num: 2 })
        Object.setPrototypeOf(counter, parentCounter)
        effect(() => (dummy = 'num' in counter))
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
        delete counter.num
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
        delete parentCounter.num
        // expect(dummy).toBe(false)
        print('dummy', dummy, false)
        counter.num = 3
        // expect(dummy).toBe(true)
        print('dummy', dummy, true)
    }),
    test('should observe inherited property accessors', () => {
        let dummy, parentDummy, hiddenValue
        const obj = reactive({})
        const parent = reactive({
            set prop(value) {
                hiddenValue = value
            },
            get prop() {
                return hiddenValue
            }
        })
        Object.setPrototypeOf(obj, parent)
        effect(() => (dummy = obj.prop))
        effect(() => (parentDummy = parent.prop))
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        // expect(parentDummy).toBe(undefined)
        print('parentDummy', parentDummy, undefined)
        obj.prop = 4
        // expect(dummy).toBe(4)
        print('dummy', dummy, 4)
        // this doesn't work, should it?
        // expect(parentDummy).toBe(4)
        parent.prop = 2
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        // expect(parentDummy).toBe(2)
        print('parentDummy', parentDummy, 2)
    }),
    test('should observe function call chains', () => {
        let dummy
        const counter = reactive({ num: 0 })
        effect(() => (dummy = getNum()))
        function getNum() {
            return counter.num
        }
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        counter.num = 2
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
    }),
    test('should observe iteration', () => {
        let dummy
        const list = reactive(['Hello'])
        effect(() => (dummy = list.join(' ')))
        // expect(dummy).toBe('Hello')
        print('dummy', dummy, 'Hello')
        list.push('World!')
        // expect(dummy).toBe('Hello World!')
        print('dummy', dummy, 'Hello World!')
        list.shift()
        // expect(dummy).toBe('World!')
        print('dummy', dummy, 'World!')
    }),
    test('should observe implicit array length changes', () => {
        let dummy
        const list = reactive(['Hello'])
        effect(() => (dummy = list.join(' ')))
        // expect(dummy).toBe('Hello')
        print('dummy', dummy, 'Hello')
        list[1] = 'World!'
        // expect(dummy).toBe('Hello World!')
        print('dummy', dummy, 'Hello World!')
        list[3] = 'Hello!'
        // expect(dummy).toBe('Hello World!  Hello!')
        print('dummy', dummy, 'Hello World!  Hello!')
    }),
    test('should observe sparse array mutations', () => {
        let dummy
        const list = reactive([])
        list[1] = 'World!'
        effect(() => (dummy = list.join(' ')))
        // expect(dummy).toBe(' World!')
        print('dummy', dummy, ' World!')
        list[0] = 'Hello'
        // expect(dummy).toBe('Hello World!')
        print('dummy', dummy, 'Hello World!')
        list.pop()
        // expect(dummy).toBe('Hello')
        print('dummy', dummy, 'Hello')
    }),
    test('should observe enumeration', () => {
        let dummy = 0
        const numbers = reactive({ num1: 3 })
        effect(() => {
            dummy = 0
            for (let key in numbers) {
                dummy += numbers[key]
            }
        })
        // expect(dummy).toBe(3)
        print('dummy', dummy, 3)
        numbers.num2 = 4
        // expect(dummy).toBe(7)
        print('dummy', dummy, 7)
        delete numbers.num1
        // expect(dummy).toBe(4)
        print('dummy', dummy, 4)
    }),
    test('should observe symbol keyed properties', () => {
        const key = Symbol('symbol keyed prop')
        let dummy, hasDummy
        const obj = reactive({ [key]: 'value' })
        effect(() => (dummy = obj[key]))
        effect(() => (hasDummy = key in obj))
        // expect(dummy).toBe('value')
        print('dummy', dummy, 'value')
        // expect(hasDummy).toBe(true)
        print('hasDummy', hasDummy, true)
        obj[key] = 'newValue'
        // expect(dummy).toBe('newValue')
        print('dummy', dummy, 'newValue')
        delete obj[key]
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        // expect(hasDummy).toBe(false)
        print('hasDummy', hasDummy, false)
    }),
    test('should not observe well-known symbol keyed properties', () => {
        const key = Symbol.isConcatSpreadable
        let dummy
        const array = reactive([])
        effect(() => (dummy = array[key]))
        // expect(array[key]).toBe(undefined)
        print('array[key]', array[key], undefined)
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        array[key] = true
        // expect(array[key]).toBe(true)
        print('array[key]', array[key], true)
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
    }),
    test('should observe function valued properties', () => {
        const oldFunc = () => {}
        const newFunc = () => true
        let dummy
        const obj = reactive({ func: oldFunc })
        effect(() => (dummy = obj.func))
        // expect(dummy).toBe(oldFunc)
        print('dummy', dummy, oldFunc)
        obj.func = newFunc
        // expect(dummy).toBe(newFunc)
        print('dummy', dummy, newFunc)
    }),
    test('should observe chained getters relying on this', () => {
        const obj = reactive({
            a: 1,
            get b() {
                return this.a
            }
        })
        let dummy
        effect(() => (dummy = obj.b))
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        obj.a++
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
    }),
    test('should observe methods relying on this', () => {
        const obj = reactive({
            a: 1,
            b() {
                return this.a
            }
        })
        let dummy
        effect(() => (dummy = obj.b()))
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        obj.a++
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
    }),
    test('should not observe set operations without a value change', () => {
        let hasDummy, getDummy
        const obj = reactive({ prop: 'value' })
        let getHaveBeenCalledTimes = 0
        let hasHaveBeenCalledTimes = 0
        effect(() => {
            getHaveBeenCalledTimes++
            getDummy = obj.prop
        })
        effect(() => {
            hasHaveBeenCalledTimes++
            hasDummy = 'prop' in obj
        })
        // expect(getDummy).toBe('value')
        print('getDummy', getDummy, 'value')
        // expect(hasDummy).toBe(true)
        print('hasDummy', hasDummy, true)
        obj.prop = 'value'
        // expect(getSpy).toHaveBeenCalledTimes(1)
        print('getHaveBeenCalledTimes', getHaveBeenCalledTimes, 1)
        // expect(hasSpy).toHaveBeenCalledTimes(1)
        print('hasHaveBeenCalledTimes', hasHaveBeenCalledTimes, 1)
        // expect(getDummy).toBe('value')
        print('getDummy', getDummy, 'value')
        // expect(hasDummy).toBe(true)
        print('hasDummy', hasDummy, true)
    }),
    test('should not observe raw mutations', () => {
        let dummy
        const obj = reactive({})
        effect(() => (dummy = toRaw(obj).prop))
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        obj.prop = 'value'
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
    }),
    test('should not be triggered by raw mutations', () => {
        let dummy
        const obj = reactive({})
        effect(() => (dummy = obj.prop))
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        toRaw(obj).prop = 'value'
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
    }),
    test('should not be triggered by inherited raw setters', () => {
        let dummy, parentDummy, hiddenValue
        const obj = reactive({})
        const parent = reactive({
            set prop(value) {
                hiddenValue = value
            },
            get prop() {
                return hiddenValue
            }
        })
        Object.setPrototypeOf(obj, parent)
        effect(() => (dummy = obj.prop))
        effect(() => (parentDummy = parent.prop))
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        // expect(parentDummy).toBe(undefined)
        print('parentDummy', parentDummy, undefined)
        toRaw(obj).prop = 4
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        // expect(parentDummy).toBe(undefined)
        print('parentDummy', parentDummy, undefined)
    }),
    test('should avoid implicit infinite recursive loops with itself', () => {
        const counter = reactive({ num: 0 })
        let haveBeenCalledTimes = 0
        effect(() => {
            haveBeenCalledTimes++
            counter.num++
        })
        // expect(counter.num).toBe(1)
        print('counter.num', counter.num, 1)
        // expect(counterSpy).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        counter.num = 4
        // expect(counter.num).toBe(5)
        print('counter.num', counter.num, 5)
        // expect(counterSpy).toHaveBeenCalledTimes(2)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
    }),
    test('should allow explicitly recursive raw function loops', () => {
        const counter = reactive({ num: 0 })
        let haveBeenCalledTimes = 0
        const numSpy = () => {
            haveBeenCalledTimes++
            counter.num++
            if (counter.num < 10) {
                numSpy()
            }
        }
        effect(numSpy)
        // expect(counter.num).toEqual(10)
        print('counter.num', counter.num, 10)
        // expect(numSpy).toHaveBeenCalledTimes(10)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 10)
    }),
    test('should avoid infinite loops with other effects', () => {
        const nums = reactive({ num1: 0, num2: 1 })
        let spy1HaveBeenCalledTimes = 0
        let spy2HaveBeenCalledTimes = 0
        const spy1 = () => {
            spy1HaveBeenCalledTimes++
            nums.num1 = nums.num2
        }
        const spy2 = () => {
            spy2HaveBeenCalledTimes++
            nums.num2 = nums.num1
        }
        effect(spy1)
        effect(spy2)
        // expect(nums.num1).toBe(1)
        // expect(nums.num2).toBe(1)
        // expect(spy1).toHaveBeenCalledTimes(1)
        // expect(spy2).toHaveBeenCalledTimes(1)
        print('nums.num1', nums.num1, 1)
        print('nums.num2', nums.num2, 1)
        print('spy1HaveBeenCalledTimes', spy1HaveBeenCalledTimes, 1)
        print('spy2HaveBeenCalledTimes', spy2HaveBeenCalledTimes, 1)
        nums.num2 = 4
        // expect(nums.num1).toBe(4)
        // expect(nums.num2).toBe(4)
        // expect(spy1).toHaveBeenCalledTimes(2)
        // expect(spy2).toHaveBeenCalledTimes(2)
        print('nums.num1', nums.num1, 4)
        print('nums.num2', nums.num2, 4)
        print('spy1HaveBeenCalledTimes', spy1HaveBeenCalledTimes, 2)
        print('spy2HaveBeenCalledTimes', spy2HaveBeenCalledTimes, 2)
        nums.num1 = 10
        // expect(nums.num1).toBe(10)
        // expect(nums.num2).toBe(10)
        // expect(spy1).toHaveBeenCalledTimes(3)
        // expect(spy2).toHaveBeenCalledTimes(3)
        print('nums.num1', nums.num1, 10)
        print('nums.num2', nums.num2, 10)
        print('spy1HaveBeenCalledTimes', spy1HaveBeenCalledTimes, 3)
        print('spy2HaveBeenCalledTimes', spy2HaveBeenCalledTimes, 3)
    }),
    test('should return a new reactive version of the function', () => {
        function greet() {
            return 'Hello World'
        }
        const effect1 = effect(greet)
        const effect2 = effect(greet)
        // expect(typeof effect1).toBe('function')
        // expect(typeof effect2).toBe('function')
        // expect(effect1).not.toBe(greet)
        // expect(effect1).not.toBe(effect2)
        print('typeof effect1', typeof effect1, 'function')
        print('typeof effect2', typeof effect2, 'function')
        print('effect1', effect1, greet, true)
        print('effect1', effect1, effect2, true)
    }),
    test('should discover new branches while running automatically', () => {
        let dummy
        const obj = reactive({ prop: 'value', run: false })
        let haveBeenCalledTimes = 0
        const conditionalSpy = () => {
            haveBeenCalledTimes++
            dummy = obj.run ? obj.prop : 'other'
        }
        effect(conditionalSpy)
        // expect(dummy).toBe('other')
        // expect(conditionalSpy).toHaveBeenCalledTimes(1)
        print('dummy', dummy, 'other')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        obj.prop = 'Hi'
        // expect(dummy).toBe('other')
        // expect(conditionalSpy).toHaveBeenCalledTimes(1)
        print('dummy', dummy, 'other')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        obj.run = true
        // expect(dummy).toBe('Hi')
        // expect(conditionalSpy).toHaveBeenCalledTimes(2)
        print('dummy', dummy, 'Hi')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
        obj.prop = 'World'
        // expect(dummy).toBe('World')
        // expect(conditionalSpy).toHaveBeenCalledTimes(3)
        print('dummy', dummy, 'World')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 3)
    }),
    test('should discover new branches when running manually', () => {
        let dummy
        let run = false
        const obj = reactive({ prop: 'value' })
        const runner = effect(() => {
            dummy = run ? obj.prop : 'other'
        })
        // expect(dummy).toBe('other')
        print('dummy', dummy, 'other')
        runner()
        // expect(dummy).toBe('other')
        print('dummy', dummy, 'other')
        run = true
        runner()
        // expect(dummy).toBe('value')
        print('dummy', dummy, 'value')
        obj.prop = 'World'
        // expect(dummy).toBe('World')
        print('dummy', dummy, 'World')
    }),
    test('should not be triggered by mutating a property, which is used in an inactive branch', () => {
        let dummy
        const obj = reactive({ prop: 'value', run: true })
        let haveBeenCalledTimes = 0
        const conditionalSpy = () => {
            haveBeenCalledTimes++
            dummy = obj.run ? obj.prop : 'other'
        }
        effect(conditionalSpy)
        // expect(dummy).toBe('value')
        // expect(conditionalSpy).toHaveBeenCalledTimes(1)
        print('dummy', dummy, 'value')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        obj.run = false
        // expect(dummy).toBe('other')
        // expect(conditionalSpy).toHaveBeenCalledTimes(2)
        print('dummy', dummy, 'other')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
        obj.prop = 'value2'
        // expect(dummy).toBe('other')
        // expect(conditionalSpy).toHaveBeenCalledTimes(2)
        print('dummy', dummy, 'other')
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
    }),
    test('should not double wrap if the passed function is a effect', () => {
        const runner = effect(() => {})
        const otherRunner = effect(runner)
        // expect(runner).not.toBe(otherRunner)
        // expect(runner.raw).toBe(otherRunner.raw)
        print('runner', runner, otherRunner, true)
        print('runner.raw', runner.raw, otherRunner.raw)
    }),
    test('should not run multiple times for a single mutation', () => {
        let dummy
        const obj = reactive({})
        let haveBeenCalledTimes = 0
        const fnSpy = () => {
            haveBeenCalledTimes++
            for (const key in obj) {
                dummy = obj[key]
            }
            dummy = obj.prop
        }
        effect(fnSpy)
        // expect(fnSpy).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        obj.prop = 16
        // expect(dummy).toBe(16)
        print('dummy', dummy, 16)
        // expect(fnSpy).toHaveBeenCalledTimes(2)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
    }),
    test('should allow nested effects', () => {
        const nums = reactive({ num1: 0, num2: 1, num3: 2 })
        const dummy = {}
        let childHaveBeenCalledTimes = 0
        const childSpy = () => {
            childHaveBeenCalledTimes++
            dummy.num1 = nums.num1
        }
        const childeffect = effect(childSpy)
        let parentHaveBeenCalledTimes = 0
        const parentSpy = () => {
            parentHaveBeenCalledTimes++
            dummy.num2 = nums.num2
            childeffect()
            dummy.num3 = nums.num3
        }
        effect(parentSpy)
        // expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 })
        // expect(parentSpy).toHaveBeenCalledTimes(1)
        // expect(childSpy).toHaveBeenCalledTimes(2)
        print('dummy', dummy, { num1: 0, num2: 1, num3: 2 }, true)
        print('parentHaveBeenCalledTimes', parentHaveBeenCalledTimes, 1)
        print('childHaveBeenCalledTimes', childHaveBeenCalledTimes, 2)
        // this should only call the childeffect
        nums.num1 = 4
        // expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 })
        // expect(parentSpy).toHaveBeenCalledTimes(1)
        // expect(childSpy).toHaveBeenCalledTimes(3)
        print('dummy', dummy, { num1: 4, num2: 1, num3: 2 }, true)
        print('parentHaveBeenCalledTimes', parentHaveBeenCalledTimes, 1)
        print('childHaveBeenCalledTimes', childHaveBeenCalledTimes, 3)
        // this calls the parenteffect, which calls the childeffect once
        nums.num2 = 10
        // expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 })
        // expect(parentSpy).toHaveBeenCalledTimes(2)
        // expect(childSpy).toHaveBeenCalledTimes(4)
        print('dummy', dummy, { num1: 4, num2: 10, num3: 2 }, true)
        print('parentHaveBeenCalledTimes', parentHaveBeenCalledTimes, 2)
        print('childHaveBeenCalledTimes', childHaveBeenCalledTimes, 4)
        // this calls the parenteffect, which calls the childeffect once
        nums.num3 = 7
        // expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 })
        // expect(parentSpy).toHaveBeenCalledTimes(3)
        // expect(childSpy).toHaveBeenCalledTimes(5)
        print('dummy', dummy, { num1: 4, num2: 10, num3: 7 }, true)
        print('parentHaveBeenCalledTimes', parentHaveBeenCalledTimes, 3)
        print('childHaveBeenCalledTimes', childHaveBeenCalledTimes, 5)
    }),
    test('should observe json methods', () => {
        let dummy = {}
        const obj = reactive({})
        effect(() => {
            dummy = JSON.parse(JSON.stringify(obj))
        })
        obj.a = 1
        // expect(dummy.a).toBe(1)
        print('dummy.a', dummy.a, 1)
    }),
    test('should observe class method invocations', () => {
        class Model {
            constructor() {
                this.count = 0
            }
            inc() {
                this.count++
            }
        }
        const model = reactive(new Model())
        let dummy
        effect(() => {
            dummy = model.count
        })
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        model.inc()
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
    }),
    test('lazy', () => {
        const obj = reactive({ foo: 1 })
        let dummy
        const runner = effect(() => (dummy = obj.foo), { lazy: true })
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        // expect(runner()).toBe(1)
        print('runner()', runner(), 1)
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        obj.foo = 2
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
    }),
    test('scheduler', () => {
        let runner, dummy
        let haveBeenCalledTimes = 0
        const scheduler = _runner => {
            haveBeenCalledTimes++
            runner = _runner
        }
        const obj = reactive({ foo: 1 })
        effect(
            () => {
                dummy = obj.foo
            },
            { scheduler }
        )
        // expect(scheduler).not.toHaveBeenCalled()
        // expect(dummy).toBe(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 0)
        print('dummy', dummy, 1)
        // should be called on first trigger
        obj.foo++
        // expect(scheduler).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        // should not run yet
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        // manually run
        runner()
        // should have run
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
    }),
    test('events: onTrack', () => {
        let events = []
        let dummy
        let haveBeenCalledTimes = 0
        const onTrack = e => {
            haveBeenCalledTimes++
            events.push(e)
        }
        const obj = reactive({ foo: 1, bar: 2 })
        const runner = effect(
            () => {
                dummy = obj.foo
                dummy = 'bar' in obj
                dummy = Object.keys(obj)
            },
            { onTrack }
        )
        // expect(dummy).toEqual(['foo', 'bar'])
        print('dummy', dummy, ['foo', 'bar'], true)
        // expect(onTrack).toHaveBeenCalledTimes(3)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 3)
        /* expect(events).toEqual([
            {
                effect: runner,
                target: toRaw(obj),
                type: TrackOpTypes.GET,
                key: 'foo'
            },
            {
                effect: runner,
                target: toRaw(obj),
                type: TrackOpTypes.HAS,
                key: 'bar'
            },
            {
                effect: runner,
                target: toRaw(obj),
                type: TrackOpTypes.ITERATE,
                key: ITERATE_KEY
            }
        ]) */
        print(
            'events',
            events,
            [
                {
                    effect: runner,
                    target: toRaw(obj),
                    type: TrackOpTypes.GET,
                    key: 'foo'
                },
                {
                    effect: runner,
                    target: toRaw(obj),
                    type: TrackOpTypes.HAS,
                    key: 'bar'
                },
                {
                    effect: runner,
                    target: toRaw(obj),
                    type: TrackOpTypes.ITERATE,
                    key: ITERATE_KEY
                }
            ],
            true
        )
    }),
    test('events: onTrigger', () => {
        let events = []
        let dummy
        let haveBeenCalledTimes = 0
        const onTrigger = e => {
            haveBeenCalledTimes++
            events.push(e)
        }
        const obj = reactive({ foo: 1 })
        const runner = effect(
            () => {
                dummy = obj.foo
            },
            { onTrigger }
        )
        obj.foo++
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        // expect(onTrigger).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        /* expect(events[0]).toEqual({
            effect: runner,
            target: toRaw(obj),
            type: TriggerOpTypes.SET,
            key: 'foo',
            oldValue: 1,
            newValue: 2
        }) */
        print(
            'events[0]',
            events[0],
            {
                effect: runner,
                target: toRaw(obj),
                type: TriggerOpTypes.SET,
                key: 'foo',
                oldValue: 1,
                newValue: 2
            },
            true
        )
        delete obj.foo
        // expect(dummy).toBeUndefined()
        print('dummy', dummy, undefined)
        // expect(onTrigger).toHaveBeenCalledTimes(2)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
        /* expect(events[1]).toEqual({
            effect: runner,
            target: toRaw(obj),
            type: TriggerOpTypes.DELETE,
            key: 'foo',
            oldValue: 2
        }) */
        print(
            'events[1]',
            events[1],
            {
                effect: runner,
                target: toRaw(obj),
                type: TriggerOpTypes.DELETE,
                key: 'foo',
                oldValue: 2
            },
            true
        )
    }),
    test('stop', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
            dummy = obj.prop
        })
        obj.prop = 2
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        stop(runner)
        obj.prop = 3
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        // stopped effect should still be manually callable
        runner()
        // expect(dummy).toBe(3)
        print('dummy', dummy, 3)
    }),
    test('stop with scheduler', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const queue = []
        const runner = effect(
            () => {
                dummy = obj.prop
            },
            {
                scheduler: e => queue.push(e)
            }
        )
        obj.prop = 2
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        // expect(queue.length).toBe(1)
        print('queue.length', queue.length, 1)
        stop(runner)
        // a scheduled effect should not execute anymore after stopped
        queue.forEach(e => e())
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
    }),
    test('events: onStop', () => {
        let haveBeenCalledTimes = 0
        const onStop = () => {
            haveBeenCalledTimes++
        }
        const runner = effect(() => {}, {
            onStop
        })
        stop(runner)
        // expect(onStop).toHaveBeenCalled()
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    test('stop: a stopped effect is nested in a normal effect', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
            dummy = obj.prop
        })
        stop(runner)
        obj.prop = 2
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        // observed value in inner stopped effect
        // will track outer effect as an dependency
        effect(() => {
            runner()
        })
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        // notify outer effect to run
        obj.prop = 3
        // expect(dummy).toBe(3)
        print('dummy', dummy, 3)
    }),
    test('markRaw', () => {
        const obj = reactive({
            foo: markRaw({
                prop: 0
            })
        })
        let dummy
        effect(() => {
            dummy = obj.foo.prop
        })
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        obj.foo.prop++
        // expect(dummy).toBe(0)
        print('dummy', dummy, 0)
        obj.foo = { prop: 1 }
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
    }),
    test('should not be trigger when the value and the old value both are NaN', () => {
        const obj = reactive({
            foo: NaN
        })
        let haveBeenCalledTimes = 0
        const fnSpy = () => {
            haveBeenCalledTimes++
            return obj.foo
        }
        effect(fnSpy)
        obj.foo = NaN
        // expect(fnSpy).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
    }),
    test('should trigger all effects when array length is set to 0', () => {
        const observed = reactive([1])
        let dummy, record
        effect(() => {
            dummy = observed.length
        })
        effect(() => {
            record = observed[0]
        })
        // expect(dummy).toBe(1)
        // expect(record).toBe(1)
        print('dummy', dummy, 1)
        print('record', record, 1)
        observed[1] = 2
        // expect(observed[1]).toBe(2)
        print('dummy', dummy, 2)
        print('observed[1]', observed[1], 2)
        observed.unshift(3)
        // expect(dummy).toBe(3)
        // expect(record).toBe(3)
        print('dummy', dummy, 3)
        print('record', record, 3)
        observed.length = 0
        // expect(dummy).toBe(0)
        // expect(record).toBeUndefined()
        print('dummy', dummy, 0)
        print('record', record, undefined)
    })
]
