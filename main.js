import { describe as reactiveTests } from './reactive.test.js'
import { describe as reactiveArrayTests } from './reactiveArray.test.js'
import { describe as effectTests } from './effect.test.js'
import { describe as computedTests } from './computed.test.js'

/** @type {NodeListOf<HTMLInputElement>} */
const radios = document.querySelectorAll('input[type="radio"][name="import"]')

const reactiveTestElems = [
    ita1,
    ita2,
    ita3,
    ita4,
    ita5,
    ita6,
    ita7,
    ita8,
    ita9,
    ita10,
    ita11,
    ita12,
    ita13,
    ita14,
    ita15,
    ita16,
    ita17,
    ita18,
    ita19
]

const reactiveArrayTestElems = [
    itb1,
    itb2,
    itb3,
    itb4,
    itb5,
    itb6,
    itb7,
    itb8,
    itb9,
    itb10,
    itb11,
    itb12
]

const effectTestElems = [
    itc1,
    itc2,
    itc3,
    itc4,
    itc5,
    itc6,
    itc7,
    itc8,
    itc9,
    itc10,
    itc11,
    itc12,
    itc13,
    itc14,
    itc15,
    itc16,
    itc17,
    itc18,
    itc19,
    itc20,
    itc21,
    itc22,
    itc23,
    itc24,
    itc25,
    itc26,
    itc27,
    itc28,
    itc29,
    itc30,
    itc31,
    itc32,
    itc33,
    itc34,
    itc35,
    itc36,
    itc37,
    itc38,
    itc39,
    itc40,
    itc41,
    itc42,
    itc43,
    itc44,
    itc45,
    itc46,
    itc47
]

const computedTestElems = [
    itd1,
    itd2,
    itd3,
    itd4,
    itd5,
    itd6,
    itd7,
    itd8,
    itd9,
    itd10,
    itd11
]

/**
 * @param {Array<Function>} tests
 * @param {HTMLButtonElement} doAll
 * @param {Array<HTMLButtonElement>} elems
 * @param {Array<Number>} excludes
 * @param {'official'|'custom'} type
 */
const onTest = (tests, doAll, elems, excludes, type) => {
    doAll.onclick = () => {
        // 执行全部测试任务（除了被禁的）
        Promise.all(tests.filter((_, i) => !elems[i].disabled).map(it => it()))
    }
    elems.forEach((el, i) => {
        if (excludes && excludes.includes(i)) {
            // 禁用自定义还未实现的测试场景
            el.disabled = type === 'custom'
        }
        el.onclick = tests[i]
    })
}

const toTest = type => res => {
    /* reactive */
    onTest(reactiveTests(res), ita0, reactiveTestElems, [3, 4, 14], type)
    /* reactive(array) */
    onTest(reactiveArrayTests(res), itb0, reactiveArrayTestElems, [9, 10, 11], type)
    /* effect */
    onTest(effectTests(res), itc0, effectTestElems, [38, 39, 40, 41, 42, 43], type)
    /* computed */
    onTest(computedTests(res), itd0, computedTestElems, [6, 7, 8, 9, 10], type)
}

/** @param {'official'|'custom'} type */
const currentImport = type => {
    const tests = toTest(type)
    if (type === 'official') {
        console.log('current %c%s', 'color:green;', type)
        import('./reactivity.esm-browser.js').then(tests)
    } else if (type === 'custom') {
        console.log('current %c%s', 'color:blue;', type)
        import('./reactivity_custom.js').then(tests)
    }
}

/** @param {NodeListOf<HTMLInputElement>} radios */
const getRadioVal = radios => {
    let l = radios.length
    let value = ''
    while (l--) {
        const radio = radios[l]
        if (radio.checked) {
            value = radio.value
            break
        }
    }
    return value
}

radios.forEach(radio => {
    radio.onchange = () => {
        if (radio.checked) {
            console.clear()
            currentImport(radio.value)
        }
    }
})

// default
currentImport(getRadioVal(radios))
