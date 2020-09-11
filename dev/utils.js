const copy = (value, deep = true) => {
    if (value === null || typeof value !== 'object') return value

    if (value instanceof Map) {
        const obj = new Map()
        value.forEach((val, key) => {
            obj.set(key, deep ? copy(val) : val)
        })
        return obj
    }

    if (value instanceof Set) {
        const obj = new Set()
        value.forEach(val => {
            obj.add(deep ? copy(val) : val)
        })
        return obj
    }

    if (value instanceof Array) {
        return deep ? value.map(copy) : value.slice()
    }

    if (value.constructor === Object) {
        const obj = {}
        Object.keys(value).forEach(key => {
            obj[key] = deep ? copy(value[key]) : value[key]
        })
        return obj
    }

    throw new Error(`不支持复制 ${value.constructor.name} 类型`)
}

export const log = (...args) => {
    args = args.map(v => copy(v))
    console.log(...args)
}

export const isObject = val => val !== null && typeof val === 'object'

export const isFunction = val => typeof val === 'function'

export const isArray = Array.isArray

export const isEffect = fn => fn && fn._isEffect === true

export const getTargetType = val =>
    val[ReactiveFlags.SKIP] || !Reflect.isExtensible(val)
        ? TargetType.INVALID
        : TargetType.COMMON

export const TargetType = {
    INVALID: 0, // default
    COMMON: 1, // Object / Array
    COLLECTION: 2 // Map / Set / WeakMap / WeakSet
}

export const TriggerOpTypes = {
    ADD: 'add',
    SET: 'set',
    DELETE: 'delete',
    CLEAR: 'clear'
}

export const hasOwn = (val, key) =>
    Object.prototype.hasOwnProperty.call(val, key)

export const ReactiveFlags = {
    RAW: '__v_raw',
    SKIP: '__v_skip',
    IS_REACTIVE: '__v_isReactive',
    IS_READONLY: '__v_isReadonly'
}

export const isReactive = val => !!(val && val[ReactiveFlags.IS_REACTIVE])

export const toRaw = observed =>
    (observed && toRaw(observed[ReactiveFlags.RAW])) || observed

const def = (target, key, value) =>
    Reflect.defineProperty(target, key, {
        configurable: true,
        value
    })

export const markRaw = target => {
    def(target, ReactiveFlags.SKIP, true)
    return target
}

export const hasChanged = (value, oldValue) =>
    value !== oldValue && (value === value || oldValue === oldValue)

export const ITERATE_KEY = Symbol('iterate')
