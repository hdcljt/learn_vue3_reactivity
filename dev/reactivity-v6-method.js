import {
    isEffect,
    isFunction,
    isObject,
    getTargetType,
    TargetType,
    ReactiveFlags,
    TriggerOpTypes,
    isArray,
    hasOwn,
    toRaw,
    hasChanged,
    ITERATE_KEY
} from './utils.js'

const proxyMap = new WeakMap() // 缓存已经被代理的对象

const arrayInstrumentations = {}
;['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
    arrayInstrumentations[key] = function (...args) {
        const arr = toRaw(this)
        let len = this.length
        while (len--) {
            track(arr, len + '') // 跟踪数组的每一项
        }
        let res = arr[key](...args) // 先使用原始参数调用方法（参数可能是响应式的）
        if (res === -1 || res === false) {
            res = arr[key](...args.map(toRaw)) // 失败后，尝试使用参数的原始值再次调用
        }
        return res
    }
})

/** @type {ProxyHandler} */
const baseHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) return true // 检查是否被代理
        if (key === ReactiveFlags.RAW && receiver === proxyMap.get(target)) {
            return target // 访问被代理的目标对象
        }

        if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver)
        }

        const res = Reflect.get(target, key, receiver) // 和set保持格式一致
        track(target, key) // 读取属性的时候，收集依赖
        return isObject(res) ? reactive(res) : res // 值是对象则递归代理
    },
    set(target, key, value, receiver) {
        const hadKey = hasOwn(target, key)
        const oldValue = target[key]

        const res = Reflect.set(target, key, value, receiver)

        if (!hadKey) {
            // 新增主键（数组调用push依次触发：1.添加索引, 2.修改length）
            res && trigger(target, key, TriggerOpTypes.ADD, value) // 修改成功，使用修改后的属性值，通知更新
        } else if (hasChanged(value, oldValue)) {
            // 值修改（调用push，当索引添加后，length值也是最新的，不会再触发）
            res && trigger(target, key, TriggerOpTypes.SET, value) // 修改成功，使用修改后的属性值，通知更新
        }
        return res // 是否修改成功
    },
    deleteProperty(target, key) {
        const hadKey = hasOwn(target, key)
        const res = Reflect.deleteProperty(target, key)
        if (res && hadKey) {
            trigger(target, key, TriggerOpTypes.DELETE, undefined)
        }
        return res
    },
    has(target, key) {
        track(target, key)
        return Reflect.has(target, key)
    },
    ownKeys(target) {
        track(target, ITERATE_KEY)
        return Reflect.ownKeys(target)
    }
}

function reactive(target) {
    if (!isObject(target)) return target // 非对象

    if (target[ReactiveFlags.RAW]) return target // 已经是个代理了

    const existingProxy = proxyMap.get(target)
    if (existingProxy) return existingProxy // 已经被代理过了

    if (getTargetType(target) === TargetType.INVALID) return target // 不代理（1.makeRaw;2.freeze/seal/preventExtensions）

    const proxy = new Proxy(target, baseHandlers)
    proxyMap.set(target, proxy) // 缓存
    return proxy
}

/** @type {Function[]} */
const effectStack = []
/** @type {Function} */
let activeEffect
let uid = 0

/** @param {Function} fn */
function effect(fn, options = {}) {
    if (isEffect(fn)) {
        fn = fn.raw // 传入回调是 effect，则取出原始值，之后重新包装
    }
    // 对回调fn做一层包装
    const effect = function reactiveEffect() {
        if (effectStack.includes(effect)) return // 回调使用了多个计算属性
        cleanup(effect)
        try {
            effectStack.push(effect) // 压栈
            activeEffect = effect
            return fn() // 计算属性有返回值，观察该回调函数使用到的所有依赖，并被各个依赖项所绑定
        } finally {
            effectStack.pop() // 出栈
            activeEffect = effectStack[effectStack.length - 1]
        }
    }
    effect.id = uid++ // 每个effect的唯一标识
    /** @type {Array<Set<Function>>} */
    effect.deps = [] // 反向绑定，记录被当前回调依赖项所绑定的所有回调（便于清理相关属性对当前回调的绑定）
    effect.options = options
    effect._isEffect = true // 标识回调经过了 effect 包装
    effect.raw = fn // 创建时的原始回调
    if (!options.lazy) {
        effect() // 计算属性只有被访问时才执行
    }
    return effect // 便于计算属性延迟执行
}

/** @param {{ deps: Array<Set<Function>> }} effect */
function cleanup(effect) {
    const { deps } = effect
    deps.forEach(dep => {
        dep.delete(effect) // 清理与该回调相关的所有属性对该回调的绑定
    })
    deps.length = 0
}

/** @param {Function|{ get: () => any, set: (v: any) => void }} getterOrOptions */
function computed(getterOrOptions) {
    let getter,
        setter = () => {}
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    let dirty = true // 是否需要重新计算
    let val // 缓存的计算结果
    const computed = {
        get value() {
            if (dirty) {
                dirty = false
                val = runner() // 执行getter()：1.获取计算结果；2.依赖项绑定getter
                track(computed, 'value') // value属性绑定effect回调
            }
            return val
        },
        set value(newValue) {
            setter(newValue)
        }
    }
    const runner = effect(getter, {
        lazy: true, // 计算属性延迟执行getter
        scheduler: () => {
            if (dirty) return // 会在计算属性依赖项更新后，执行该调度器
            dirty = true // 触发重新计算
            trigger(computed, 'value') // 触发value属性绑定的回调被执行，执行后会触发读取value属性值
        }
    })
    return computed // 返回计算属性对象
}

/** @type {WeakMap<object, Map<string, Set<Function>>>} */
const targetMap = new WeakMap() // 缓存：当属性值修改时，需要触发更新的回调集合

/**
 *  targetMap: WeakMap, depsMap: Map, deps: Set
 *  targetMap.set(target, depsMap)
 *  depsMap.set(key, deps)
 *  deps.add(activeEffect)
 *  {
 *     [target] => {
 *         ...,
 *         [key] => [
 *             ...,
 *             activeEffect
 *         ]
 *     },
 *  }
 */
function track(target, key) {
    if (!activeEffect) return // 没有回调需要依赖此属性
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map())) // 缓存对象
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, (deps = new Set())) // 缓存属性
    }
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect) // 给当前属性绑定依赖此属性的回调
        activeEffect.deps.push(deps) // 给当前回调反向绑定依赖此属性的所有回调
    }
}

function trigger(target, key, type, newValue) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return // 没有回调需要依赖此对象
    /** @type {Set<Function>} */
    const effects = new Set()
    /** @param {Set<Function>} effectsToAdd 依赖此属性的回调集合 */
    const add = effectsToAdd => {
        if (!effectsToAdd) return // 没有回调需要依赖此属性
        effectsToAdd.forEach(effect => effects.add(effect))
    }

    if (key === 'length' && isArray(target)) {
        // 使用 arr.length = num 截断数组，多余的元素更新为 undefined
        depsMap.forEach((deps, key) => {
            if (key !== 'length' && key < newValue) return
            add(deps) // key === 'length' || index >= newLength
        })
    } else {
        add(depsMap.get(key))
        if (type === TriggerOpTypes.ADD) {
            // 新增（没有指定键的依赖，数组查找length，对象查找ITERATE_KEY）
            add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
        }
    }

    /**
     *  effects用于拷贝deps，因为deps循环过程中，delete=>add会陷入死循环
     *  const arr = [1]
     *  arr.forEach(v => {
     *      console.log(v)
     *      arr.length = 0
     *      arr.push(++v)
     *  })
     *  const dep = new Set([1])
     *  dep.forEach(v => {
     *      console.log(v)
     *      dep.delete(v)
     *      dep.add(++v)
     *  })
     */
    effects.forEach(effect => {
        if (effect.options.scheduler) {
            effect.options.scheduler() // 被计算属性依赖，触发调度器，由调度器触发执行依赖value属性的effect回调
        } else {
            effect() // 普通属性更新，执行依赖此属性的effect回调
        }
    })
}

export { reactive, effect, computed }
