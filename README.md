# 简单实现 Vue3 源码

> 当前 `vue-next` 版本 `3.0.0-rc.10`。 参考源码，简单实现一下 `reactive`, `effect`, `computed`（目的加深自己的理解）。

## 了解 Proxy/Reflect

-   **Proxy** 【代理】代理目标对象，自定义行为
-   **Reflect** 【反射】对自身行为的描述

```js
const createProxy = obj =>
    new Proxy(obj, {
        get(target, key, receiver) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.get(...arguments) // 读取target对象key属性的值（target[key]）
        },
        set(target, key, value, receiver) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.set(...arguments) // 给target对象的key属性赋值value（target[key] = value）
        },
        has(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.has(...arguments) // 属性key是否在target对象或其原型链中（key in target）
        },
        ownKeys(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.ownKeys(...arguments) // 获取自身属性的数组（Object.keys/Reflect.ownKeys/Object.getOwnPropertyNames/Object.getOwnPropertySymbols）
        },
        deleteProperty(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.deleteProperty(...arguments) // 删除target对象的key属性（delete target[key]）
        },
        defineProperty(target, key, descriptor) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.defineProperty(...arguments) // 给target对象定义key属性，描述符选项为descriptor
        },
        getOwnPropertyDescriptor(target, key) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.getOwnPropertyDescriptor(...arguments) // 获取key的属性描述符
        },
        getPrototypeOf(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.getPrototypeOf(...arguments) // 读取target原型
        },
        setPrototypeOf(target, proto) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.setPrototypeOf(...arguments) // 设置target的原型为proto
        },
        isExtensible(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.isExtensible(...arguments) // target对象是否可扩展（被freeze/seal/preventExtensions方法标记过）
        },
        preventExtensions(target) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.preventExtensions(...arguments) // 阻止target对象扩展属性
        },
        apply(target, thisArg, argList) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.apply(...arguments) // target作为函数被调用
        },
        construct(target, argList, newTarget) {
            console.log(`[${arguments.callee.name}]`, ...arguments)
            return Reflect.construct(...arguments) // target作为构造函数创建实例（new）
        }
    })
```

-   defineProperty(target, key, descriptor)
    -   descriptor
        -   **configurable** 删（修改描述符），默认 `false`
        -   **enumerable** 查，默认 `false`（`for...in`/`Object.keys`/`Object.assign`/`{...obj}`）
        -   **writable** 改，默认 `false`
        -   **value** 增，默认 `undefined`
        -   **get()** / **set(value)** 增/改，默认 `undefined`（跟 `value`/`writable` 互斥）

## 响应式的基本原理

```js
new Proxy(target, {
    get(target, key, receiver) {
        track(target, key) // 【跟踪】收集依赖该属性的回调函数
        return Reflect.get(...arguments)
    },
    set(target, key, value, receiver) {
        const res = Reflect.set(...arguments)
        trigger(target, key) // 【触发】执行收集的函数（数据更新后）
        return res
    }
})
```

## 实现简单的响应式系统

> 基于 `vue@3.0.0-rc.10` 版本的简化，[代码仓库在此](https://github.com/hdcljt/learn_vue3_reactivity.git "代码仓库")

### 最基础的响应式

-   **reactivity.js** （核心是 `reactive` 和 `effect`）

```js
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
```

-   **demo**

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Demo</title>
        <style>
            body {
                display: flex;
                flex-direction: column;
                align-items: center;
                font-size: x-large;
            }
            label {
                display: flex;
                align-items: center;
            }
        </style>
    </head>
    <body>
        <label>Range 1:<input type="range" min="0" max="100" id="r1" /></label>
        <label>Range 2:<input type="range" min="0" max="100" id="r2" /></label>
        <div id="text"></div>
        <script type="module">
            import { reactive, effect } from './reactivity.js'
            const obj = reactive({ r: 20 })
            effect(() => {
                r1.value = obj.r
                text.innerHTML = obj.r
            })
            r1.oninput = () => {
                obj.r = r1.value
            }
            r2.oninput = () => {
                obj.r = r2.value
            }
        </script>
    </body>
</html>
```

### 嵌套（对象属性依旧是对象）

```diff
+ const isObject = val => val !== null && typeof val === 'object'
const baseHandlers = {
    get(target, key, receiver) {
+       const res = Reflect.get(target, key, receiver) // 和set保持格式一致
        track(target, key) // 读取属性的时候，收集依赖
-       return Reflect.get(target, key, receiver)
+       return isObject(res) ? reactive(res) : res // 值是对象则递归代理
    },
    set(target, key, value, receiver) {
-       Reflect.set(target, key, value, receiver)
+       const res = Reflect.set(target, key, value, receiver)
        trigger(target, key) // 使用修改后的属性值，通知更新
-       return true
+       return res // 是否修改成功
    }
}
```

### 计算属性 computed

```diff
+ /** @type {Function[]} */
+ const effectStack = []
/** @type {Function} */
let activeEffect
+ let uid = 0

- function effect(fn) {
-     try {
-         activeEffect = fn
-         fn() // 立即执行，观察该回调函数使用到的所有依赖，并被各个依赖项所绑定
-     } finally {
-         activeEffect = null
-     }
- }
+ function effect(fn, options = {}) {
+     // 对回调 fn 做一层包装
+     const effect = function reactiveEffect() {
+         if (effectStack.includes(effect)) return // 回调中可能使用了多个计算属性
+         cleanup(effect)
+         try {
+             effectStack.push(effect) // 压栈
+             activeEffect = effect
+             return fn() // 计算属性有返回值，观察该回调函数使用到的所有依赖，并被各个依赖项所绑定
+         } finally {
+             effectStack.pop() // 出栈
+             activeEffect = effectStack[effectStack.length - 1]
+         }
+     }
+     effect.id = uid++ // 每个effect的唯一标识
+     /** @type {Array<Set<Function>>} */
+     effect.deps = [] // 反向绑定，记录被当前回调依赖项所绑定的所有回调（便于清理相关属性对当前回调的绑定）
+     effect.options = options
+     if (!options.lazy) {
+         effect() // 计算属性只有被访问时才执行
+     }
+     return effect // 便于计算属性延迟执行
+ }

+ /** @param {{ deps: Array<Set<Function>> }} effect */
+ function cleanup(effect) {
+     const { deps } = effect
+     deps.forEach(dep => {
+         dep.delete(effect) // 清理与该回调相关的所有属性对该回调的绑定
+     })
+     deps.length = 0
+ }

+ /** @param {Function} getter */
+ function computed(getter) {
+     let dirty = true // 是否需要重新计算
+     let val // 缓存的计算结果
+     const computed = {
+         get value() {
+             if (dirty) {
+                 dirty = false
+                 val = runner() // 执行getter()：1.获取计算结果；2.依赖项绑定getter
+                 track(computed, 'value') // value属性绑定effect回调
+             }
+             return val
+         }
+     }
+     const runner = effect(getter, {
+         lazy: true, // 计算属性延迟执行getter
+         scheduler: () => {
+             if (dirty) return // 会在计算属性依赖项更新后，执行该调度器
+             dirty = true // 触发重新计算
+             trigger(computed, 'value') // 触发value属性绑定的回调被执行，执行后会触发读取value属性值
+         }
+     })
+     return computed // 返回计算属性对象
+ }

function track(target, key) {
    ...
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect) // 给当前属性绑定依赖此属性的回调
+       activeEffect.deps.push(deps) // 给当前回调反向绑定依赖此属性的所有回调
    }
}

function trigger(target, key) {
    ...
    const deps = depsMap.get(key)
    if (!deps) return // 没有回调需要依赖此属性
-   deps.forEach(dep => dep()) // 重新执行依赖此属性的所有回调
+   /** @type {Set<Function>} */
+   const effects = new Set()
+   deps.forEach(dep => effects.add(dep))
+   /**
+    *  effects用于拷贝deps，因为deps循环过程中，delete=>add会陷入死循环
+    *  const arr = [1]
+    *  arr.forEach(v => {
+    *      console.log(v)
+    *      arr.length = 0
+    *      arr.push(++v)
+    *  })
+    *  const dep = new Set([1])
+    *  dep.forEach(v => {
+    *      console.log(v)
+    *      dep.delete(v)
+    *      dep.add(++v)
+    *  })
+    */
+   effects.forEach(effect => {
+       if (effect.options.scheduler) {
+           effect.options.scheduler() // 被计算属性依赖，触发调度器，由调度器触发执行依赖value属性的+effect回调
+       } else {
+           effect() // 普通属性更新，执行依赖此属性的effect回调
+       }
+   })
}

- export { reactive, effect }
+ export { reactive, effect, computed }
```

### 补充对象逻辑

-   **reactivity.js**

```diff
- const isObject = val => val !== null && typeof val === 'object'
+ import {
+     isEffect,
+     isFunction,
+     isObject,
+     getTargetType,
+     TargetType,
+     ReactiveFlags
+ } from './utils.js'

+ const proxyMap = new WeakMap() // 缓存已经被代理的对象

const baseHandlers = {
    get(target, key, receiver) {
+       if (key === ReactiveFlags.IS_REACTIVE) return true // 检查是否被代理
+       if (key === ReactiveFlags.RAW && receiver === proxyMap.get(target)) {
+           return target // 访问被代理的目标对象
+       }
        const res = Reflect.get(target, key, receiver) // 和set保持格式一致
        track(target, key) // 读取属性的时候，收集依赖
        return isObject(res) ? reactive(res) : res // 值是对象则递归代理
    },
    ...
}

function reactive(target) {
-    return new Proxy(target, baseHandlers)
+    if (!isObject(target)) return target // 非对象

+    if (target[ReactiveFlags.RAW]) return target // 已经是个代理了

+    const existingProxy = proxyMap.get(target)
+    if (existingProxy) return existingProxy // 已经被代理过了

+    if (getTargetType(target) === TargetType.INVALID) return target // 不代理（1.makeRaw;2.freeze/+seal/preventExtensions）

+    const proxy = new Proxy(target, baseHandlers)
+    proxyMap.set(target, proxy) // 缓存
+    return proxy
}

function effect(fn, options = {}) {
+   if (isEffect(fn)) {
+       fn = fn.raw // 传入回调是 effect，则取出原始值，之后重新包装
+   }
    // 对回调 fn 做一层包装
    const effect = function reactiveEffect() {
    ...
    effect.options = options
+   effect._isEffect = true // 标识回调经过了 effect 包装
+   effect.raw = fn // 创建时的原始回调
    if (!options.lazy) {
        effect() // 计算属性只有被访问时才执行
    }
    return effect // 便于计算属性延迟执行
}

- /** @param {Function} getter */
+ /** @param {Function|{ get: () => any, set: (v: any) => void }} getterOrOptions */
- function computed(getter) {
+ function computed(getterOrOptions) {
+   let getter, setter = () => {}
+   if (isFunction(getterOrOptions)) {
+       getter = getterOrOptions
+   } else {
+       getter = getterOrOptions.get
+       setter = getterOrOptions.set
+   }
    ...
    const computed = {
        get value() {
            ...
        },
+       set value(newValue) {
+           setter(newValue)
+       }
    }
    ...
    return computed // 返回计算属性对象
}
```

-   **utils.js**

```js
export const isEffect = fn => fn && fn._isEffect === true

export const isFunction = val => typeof val === 'function'

export const isObject = val => val !== null && typeof val === 'object'

export const getTargetType = val =>
    val[ReactiveFlags.SKIP] || !Reflect.isExtensible(val)
        ? TargetType.INVALID
        : TargetType.COMMON

export const TargetType = {
    INVALID: 0, // default
    COMMON: 1, // Object / Array
    COLLECTION: 2 // Map / Set / WeakMap / WeakSet
}

export const ReactiveFlags = {
    RAW: '__v_raw',
    SKIP: '__v_skip',
    IS_REACTIVE: '__v_isReactive',
    IS_READONLY: '__v_isReadonly'
}
```

### 添加数组逻辑

-   **reactivity.js**

```diff
import {
    ...
    ReactiveFlags,
+   TriggerOpTypes,
+   isArray,
+   hasOwn,
+   toRaw,
+   hasChanged
} from './utils.js'

+ const arrayInstrumentations = {}
+ ;['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
+     arrayInstrumentations[key] = function (...args) {
+         const arr = toRaw(this)
+         let len = this.length
+         while (len--) {
+             track(arr, len + '') // 跟踪数组的每一项
+         }
+         let res = arr[key](...args) // 先使用原始参数调用方法（参数可能是响应式的）
+         if (res === -1 || res === false) {
+             res = arr[key](...args.map(toRaw)) // 失败后，尝试使用参数的原始值再次调用
+         }
+         return res
+     }
+ })

const baseHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) return true // 检查是否被代理
        if (key === ReactiveFlags.RAW && receiver === proxyMap.get(target)) {
            return target // 访问被代理的目标对象
        }

+       if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
+           return Reflect.get(arrayInstrumentations, key, receiver)
+       }

        const res = Reflect.get(target, key, receiver) // 和set保持格式一致
        track(target, key) // 读取属性的时候，收集依赖
        return isObject(res) ? reactive(res) : res // 值是对象则递归代理
    },
    set(target, key, value, receiver) {
+       const hadKey = hasOwn(target, key)
+       const oldValue = target[key]

        const res = Reflect.set(target, key, value, receiver)

-       trigger(target, key) // 使用修改后的属性值，通知更新
+       if (!hadKey) {
+           // 新增主键（数组调用push依次触发：1.添加索引, 2.修改length）
+           trigger(target, key, TriggerOpTypes.ADD, value) // 修改成功，使用修改后的属性值，通知更新
+       } else if (hasChanged(value, oldValue)) {
+           // 值修改（调用push，当索引添加后，length值也是最新的，不会再触发）
+           trigger(target, key, TriggerOpTypes.SET, value) // 修改成功，使用修改后的属性值，通知更新
+       }
        return res // 是否修改成功
    }
}

function trigger(target, key, type, newValue) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return // 没有回调需要依赖此对象
-   const deps = depsMap.get(key)
-   if (!deps) return // 没有回调需要依赖此属性
    /** @type {Set<Function>} */
    const effects = new Set()
-   deps.forEach(dep => effects.add(dep))
+   /** @param {Set<Function>} effectsToAdd 依赖此属性的回调集合 */
+   const add = effectsToAdd => {
+       if (!effectsToAdd) return // 没有回调需要依赖此属性
+       effectsToAdd.forEach(effect => effects.add(effect))
+   }

+   if (key == 'length' && isArray(target)) {
+       // 使用 arr.length = num 截断数组，多余的元素更新为 undefined
+       depsMap.forEach((deps, key) => {
+           if (key != 'length' && key < newValue) return
+           add(deps) // key == 'length' || index >= newLength
+       })
+   } else {
+       add(depsMap.get(key))
+   }
    ...
    effects.forEach(effect => {
        ...
    })
}
```

-   **utils.js**

```diff
+ export const TriggerOpTypes = {
+     ADD: 'add',
+     SET: 'set',
+     DELETE: 'delete',
+     CLEAR: 'clear'
+ }

+ export const isArray = Array.isArray

+ export const hasOwn = (val, key) =>
+    Object.prototype.hasOwnProperty.call(val, key)

+ export const toRaw = observed =>
+     (observed && toRaw(observed[ReactiveFlags.RAW])) || observed

+ export const hasChanged = (value, oldValue) =>
+     value !== oldValue && (value === value || oldValue === oldValue)
```

### 补充代理行为 （deleteProperty/has/ownKeys）

-   **reactivity.js**

```diff
import {
    ...
    hasChanged,
+   ITERATE_KEY
} from './utils.js'

const baseHandlers = {
    get(target, key, receiver) {
        ...
    },
    set(target, key, value, receiver) {
        ...
    },
+   deleteProperty(target, key) {
+       const hadKey = hasOwn(target, key)
+       const res = Reflect.deleteProperty(target, key)
+       if (res && hadKey) {
+           trigger(target, key, TriggerOpTypes.DELETE, undefined)
+       }
+       return res
+   },
+   has(target, key) {
+       track(target, key)
+       return Reflect.has(target, key)
+   },
+   ownKeys(target) {
+       track(target, ITERATE_KEY)
+       return Reflect.ownKeys(target)
+   }
}

function trigger(target, key, type, newValue) {
    ...
    if (key == 'length' && isArray(target)) {
        // 使用 arr.length = num 截断数组，多余的元素更新为 undefined
        depsMap.forEach((deps, key) => {
            if (key != 'length' && key < newValue) return
            add(deps) // key == 'length' || index >= newLength
        })
    } else {
        add(depsMap.get(key))
+       if (type === TriggerOpTypes.ADD) {
+           // 新增（没有指定键的依赖，数组查找length，对象查找ITERATE_KEY）
+           add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
+       }
    }
    ...
}
```

-   **utils.js**

```diff
+ export const ITERATE_KEY = Symbol('iterate')
```

## 参考文献

-   [Proxy | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy 'https://developer.mozilla.org/.../Proxy')
-   [Reflect | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect 'https://developer.mozilla.org/.../Reflect')
-   [vuejs/vue-next](https://github.com/vuejs/vue-next 'vue3.0官方仓库')
-   [Vue3.0 官网](https://v3.vuejs.org 'https://v3.vuejs.org')
