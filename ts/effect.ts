import type { ReactiveEffectOptions, ReactiveEffect } from './types'

export function isEffect (fn: any): fn is ReactiveEffect {
    return fn && fn._isEffect === true
}

export function effect<T = any> (
    fn: () => T,
    options: ReactiveEffectOptions = {}
): ReactiveEffect<T> {
    if (isEffect(fn)) {
        fn = fn.raw
    }
    const effect = createReactiveEffect(fn, options)
    if (!options.lazy) {
        effect()
    }
    return effect
}

const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined
let uid = 0

function createReactiveEffect<T = any> (
    fn: () => T,
    options: ReactiveEffectOptions
): ReactiveEffect<T> {
    const effect = function reactiveEffect (): unknown {
        if (!effect.active) {
            return options.scheduler ? undefined : fn()
        }
        if (!effectStack.includes(effect)) {
            cleanup(effect)
            try {
                effectStack.push(effect)
                activeEffect = effect
                return fn()
            } finally {
                effectStack.pop()
                activeEffect = effectStack[effectStack.length - 1]
            }
        }
    } as ReactiveEffect
    effect.id = uid++
    effect._isEffect = true
    effect.active = true
    effect.raw = fn
    effect.deps = []
    effect.options = options
    return effect
}

function cleanup (effect: ReactiveEffect) {
    const { deps } = effect
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect)
        }
        deps.length = 0
    }
}
