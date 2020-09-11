import { reactive, effect } from './reactivity-v1-basic.js'

// case: 1
{
    const rgb = {
        r: 162,
        g: 191,
        b: 255
    }

    const proxyRgb = reactive(rgb)

    r.value = proxyRgb.r
    g.value = proxyRgb.g
    b.value = proxyRgb.b

    color.style.backgroundColor = `rgb(${proxyRgb.r}, ${proxyRgb.g}, ${proxyRgb.b})`

    r.addEventListener('input', () => {
        proxyRgb.r = r.value
    })
    g.addEventListener('input', () => {
        proxyRgb.g = g.value
    })
    b.addEventListener('input', () => {
        proxyRgb.b = b.value
    })

    effect(() => {
        color.style.backgroundColor = `rgb(${proxyRgb.r}, ${proxyRgb.g}, ${proxyRgb.b})`
        text.innerHTML = `rgb(${proxyRgb.r}, ${proxyRgb.g}, ${proxyRgb.b})`
        console.log('effect', text.innerHTML)
    })
}

// case: 2
{
}
