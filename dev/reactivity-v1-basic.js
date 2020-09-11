/** @type {ProxyHandler} */
const baseHandlers = {
    get(target, key, receiver) {
        track(target, key) // 读取属性的时候，收集依赖
        return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
        Reflect.set(target, key, value, receiver)
        trigger(target, key) // 使用修改后的属性值，通知更新
        return true
    }
}

function reactive(target) {
    return new Proxy(target, baseHandlers)
}

/** @type {Function} */
let activeEffect

/** @param {Function} fn */
function effect(fn) {
    try {
        activeEffect = fn
        fn() // 立即执行，观察该回调函数使用到的所有依赖，并被各个依赖项所绑定
    } finally {
        activeEffect = null
    }
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
        deps.add(activeEffect) // 绑定依赖此属性的回调
    }
}

function trigger(target, key) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return // 没有回调需要依赖此对象
    const deps = depsMap.get(key)
    if (!deps) return // 没有回调需要依赖此属性
    deps.forEach(dep => dep()) // 重新执行依赖此属性的所有回调
}

export { reactive, effect }
