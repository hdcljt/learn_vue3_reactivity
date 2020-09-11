const createProxy = obj =>
    new Proxy(obj, {
        get(target, key, receiver) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.get(target, key, receiver)
        },
        set(target, key, value, receiver) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.set(target, key, value, receiver)
        },
        has(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.has(target, key)
        },
        ownKeys(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.deleteProperty(target, key)
        },
        defineProperty(target, key, descriptor) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.defineProperty(target, key, descriptor)
        },
        getOwnPropertyDescriptor(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.getOwnPropertyDescriptor(target, key)
        },
        getPrototypeOf(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.getPrototypeOf(target)
        },
        setPrototypeOf(target, proto) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.setPrototypeOf(target, proto)
        },
        isExtensible(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.isExtensible(target)
        },
        preventExtensions(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.preventExtensions(target)
        },
        apply(target, thisArg, argList) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.apply(target, thisArg, argList)
        },
        construct(target, argList, newTarget) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.construct(target, argList, newTarget)
        }
    })

{
    const arrayInstrumentations = {}
    ;['includes'].forEach(name => {
        arrayInstrumentations[name] = function (...args) {
            const arr = this['__raw']
            console.log('arr', arr)
            return arr[name](...args)
        }
    })

    const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

    const isObject = val => val !== null && typeof val === 'object'

    const isSymbol = val => typeof val === 'symbol'

    const builtInSymbols = new Set(
        Reflect.ownKeys(Symbol)
            .map(k => Symbol[k])
            .filter(isSymbol)
    )

    const toRaw = val => val && toRaw(val.__raw) || val

    const createProxy = obj =>
        new Proxy(obj, {
            get(target, key, receiver) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                if (key === '__raw') return target
                if (hasOwn(arrayInstrumentations, key)) {
                    return Reflect.get(arrayInstrumentations, key, receiver)
                }
                const res = Reflect.get(target, key, receiver)
                // const keyIsSymbol = isSymbol(key)
                // if (
                //     keyIsSymbol ? builtInSymbols.has(key) : key === '__proto__'
                // ) {
                //     return res
                // }
                return isObject(res) ? createProxy(res) : res
            },
            set(target, key, value, receiver) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                if (target === toRaw(receiver)) {
                    console.log('====')
                } else {
                    console.log('!===')
                }
                return Reflect.set(target, key, value, receiver)
            },
            has(target, key) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.has(target, key)
            },
            ownKeys(target) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.ownKeys(target)
            },
            deleteProperty(target, key) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.deleteProperty(target, key)
            },
            defineProperty(target, key, descriptor) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.defineProperty(target, key, descriptor)
            },
            getOwnPropertyDescriptor(target, key) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.getOwnPropertyDescriptor(target, key)
            },
            getPrototypeOf(target) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.getPrototypeOf(target)
            },
            setPrototypeOf(target, proto) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.setPrototypeOf(target, proto)
            },
            isExtensible(target) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.isExtensible(target)
            },
            preventExtensions(target) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.preventExtensions(target)
            },
            apply(target, thisArg, argList) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.apply(target, thisArg, argList)
            },
            construct(target, argList, newTarget) {
                console.log(`[${arguments.callee.name}]`, ...arguments)
                return Reflect.construct(target, argList, newTarget)
            }
        })
}
