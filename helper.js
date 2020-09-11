export const print = (
    desc,
    result,
    expect,
    useWarn = false,
    desc2 = 'except'
) => {
    const getRawType = val => Object.prototype.toString.call(val).slice(8, -1)
    const resFmt = val => {
        const type = getRawType(val)
        let fmt = '"%o"'
        if (type === 'String') {
            fmt = '"%s"'
        } else if (type === 'Number') {
            fmt = /\.(?=\d+$)/.test(val) ? '"%f"' : '"%d"'
        }
        return `${fmt}(${type})`
    }
    const infoColor = '#009688'
    const resColor = (val1, val2) => {
        const warnColor = '#ff9800'
        if (useWarn) return warnColor
        const errColor = '#f44336'
        const succColor = '#4caf50'
        const type1 = getRawType(val1)
        const type2 = getRawType(val2)
        if (type1 !== type2) return errColor
        // if (useWarn && isObject(val1)) return warnColor
        return Object.is(val1, val2) ? succColor : errColor
    }
    const keyFmt = '%c%s%c'
    const format = `${keyFmt} ${resFmt(result)}, ${keyFmt} ${resFmt(expect)}`
    const reset = 'background:transparent;'
    const basic = 'padding:0 4px;border-radius:4px;color:#fff;'
    const style1 = `${basic}background:${infoColor};`
    const style2 = `${basic}background:${resColor(result, expect)};`
    const msg = [
        format,
        style1,
        desc,
        reset,
        result,
        style2,
        desc2,
        reset,
        expect
    ]
    return console.log(...msg) // console.log.apply(null, msg)
}

export const test = (name, fn) => () =>
    new Promise(resolve => {
        // console.groupCollapsed(name)
        console.group(name)
        fn()
        console.groupEnd()
        resolve()
    })
