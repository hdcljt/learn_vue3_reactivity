import { print, test } from './helper.js'

export const describe = ({
    computed,
    reactive,
    effect,
    stop,
    ref,
    isReadonly
}) => [
    test('should return updated value', () => {
        const value = reactive({})
        const cValue = computed(() => value.foo)
        // expect(cValue.value).toBe(undefined)
        print('cValue.value', cValue.value, undefined)
        value.foo = 1
        // expect(cValue.value).toBe(1)
        print('cValue.value', cValue.value, 1)
    }),
    test('should compute lazily', () => {
        const value = reactive({})
        let haveBeenCalledTimes = 0
        const getter = () => {
            haveBeenCalledTimes++
            return value.foo
        }
        const cValue = computed(getter)
        // lazy
        // expect(getter).not.toHaveBeenCalled()
        print('haveBeenCalledTimes', haveBeenCalledTimes, 0)
        // expect(cValue.value).toBe(undefined)
        print('cValue.value', cValue.value, undefined)
        // expect(getter).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        // should not compute again
        cValue.value
        // expect(getter).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        // should not compute until needed
        value.foo = 1
        // expect(getter).toHaveBeenCalledTimes(1)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 1)
        // now it should compute
        // expect(cValue.value).toBe(1)
        print('cValue.value', cValue.value, 1)
        // expect(getter).toHaveBeenCalledTimes(2)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
        // should not compute again
        cValue.value
        // expect(getter).toHaveBeenCalledTimes(2)
        print('haveBeenCalledTimes', haveBeenCalledTimes, 2)
    }),
    test('should trigger effect', () => {
        const value = reactive({})
        const cValue = computed(() => value.foo)
        let dummy
        effect(() => {
            dummy = cValue.value
        })
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        value.foo = 1
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
    }),
    test('should work when chained', () => {
        const value = reactive({ foo: 0 })
        const c1 = computed(() => value.foo)
        const c2 = computed(() => c1.value + 1)
        // expect(c2.value).toBe(1)
        // expect(c1.value).toBe(0)
        print('c2.value', c2.value, 1)
        print('c1.value', c1.value, 0)
        value.foo++
        // expect(c2.value).toBe(2)
        // expect(c1.value).toBe(1)
        print('c2.value', c2.value, 2)
        print('c1.value', c1.value, 1)
    }),
    test('should trigger effect when chained', () => {
        const value = reactive({ foo: 0 })
        let getter1CalledTimes = 0
        const getter1 = () => {
            getter1CalledTimes++
            return value.foo
        }
        let getter2CalledTimes = 0
        const getter2 = () => {
            getter2CalledTimes++
            return c1.value + 1
        }
        const c1 = computed(getter1)
        const c2 = computed(getter2)
        let dummy
        effect(() => {
            dummy = c2.value
        })
        // expect(dummy).toBe(1)
        // expect(getter1).toHaveBeenCalledTimes(1)
        // expect(getter2).toHaveBeenCalledTimes(1)
        print('dummy', dummy, 1)
        print('getter1CalledTimes', getter1CalledTimes, 1)
        print('getter2CalledTimes', getter2CalledTimes, 1)
        value.foo++
        // expect(dummy).toBe(2)
        print('dummy', dummy, 2)
        // should not result in duplicate calls
        // expect(getter1).toHaveBeenCalledTimes(2)
        // expect(getter2).toHaveBeenCalledTimes(2)
        print('getter1CalledTimes', getter1CalledTimes, 2)
        print('getter2CalledTimes', getter2CalledTimes, 2)
    }),
    test('should trigger effect when chained (mixed invocations)', () => {
        const value = reactive({ foo: 0 })
        let getter1CalledTimes = 0
        const getter1 = () => {
            getter1CalledTimes++
            return value.foo
        }
        let getter2CalledTimes = 0
        const getter2 = () => {
            getter2CalledTimes++
            return c1.value + 1
        }
        const c1 = computed(getter1)
        const c2 = computed(getter2)
        let dummy
        effect(() => {
            dummy = c1.value + c2.value
        })
        // expect(dummy).toBe(1)
        // expect(getter1).toHaveBeenCalledTimes(1)
        // expect(getter2).toHaveBeenCalledTimes(1)
        print('dummy', dummy, 1)
        print('getter1CalledTimes', getter1CalledTimes, 1)
        print('getter2CalledTimes', getter2CalledTimes, 1)
        value.foo++
        // expect(dummy).toBe(3)
        print('dummy', dummy, 3)
        // should not result in duplicate calls
        // expect(getter1).toHaveBeenCalledTimes(2)
        // expect(getter2).toHaveBeenCalledTimes(2)
        print('getter1CalledTimes', getter1CalledTimes, 2)
        print('getter2CalledTimes', getter2CalledTimes, 2)
    }),
    test('should no longer update when stopped', () => {
        const value = reactive({})
        const cValue = computed(() => value.foo)
        let dummy
        effect(() => {
            dummy = cValue.value
        })
        // expect(dummy).toBe(undefined)
        print('dummy', dummy, undefined)
        value.foo = 1
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        stop(cValue.effect)
        value.foo = 2
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
    }),
    test('should support setter', () => {
        const n = ref(1)
        const plusOne = computed({
            get: () => n.value + 1,
            set: val => {
                n.value = val - 1
            }
        })
        // expect(plusOne.value).toBe(2)
        print('plusOne.value', plusOne.value, 2)
        n.value++
        // expect(plusOne.value).toBe(3)
        print('plusOne.value', plusOne.value, 3)
        plusOne.value = 0
        // expect(n.value).toBe(-1)
        print('n.value', n.value, -1)
    }),
    test('should trigger effect w/ setter', () => {
        const n = ref(1)
        const plusOne = computed({
            get: () => n.value + 1,
            set: val => {
                n.value = val - 1
            }
        })
        let dummy
        effect(() => {
            dummy = n.value
        })
        // expect(dummy).toBe(1)
        print('dummy', dummy, 1)
        plusOne.value = 0
        // expect(dummy).toBe(-1)
        print('dummy', dummy, -1)
    }),
    test('should warn if trying to set a readonly computed', () => {
        const n = ref(1)
        const plusOne = computed(() => n.value + 1)
        plusOne.value++ // Type cast to prevent TS from preventing the error
        /* expect(
            'Write operation failed: computed value is readonly'
        ).toHaveBeenWarnedLast() */
    }),
    test('should be readonly', () => {
        let a = { a: 1 }
        const x = computed(() => a)
        // expect(isReadonly(x)).toBe(true)
        // expect(isReadonly(x.value)).toBe(false)
        // expect(isReadonly(x.value.a)).toBe(false)
        print('isReadonly(x)', isReadonly(x), true)
        print('isReadonly(x.value)', isReadonly(x.value), false)
        print('isReadonly(x.value.a)', isReadonly(x.value.a), false)
        const z = computed({
            get() {
                return a
            },
            set(v) {
                a = v
            }
        })
        // expect(isReadonly(z)).toBe(false)
        // expect(isReadonly(z.value.a)).toBe(false)
        print('isReadonly(z)', isReadonly(z), false)
        print('isReadonly(z.value.a)', isReadonly(z.value.a), false)
    })
]
