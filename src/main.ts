const NOOP = () => {}
const cb = () => `__${(Date.now()).toString(36)}`

const defaultConfig = {
  timeout: 3e3,
  origin: '*'
}

export default (config) => {
  const configData = typeof config === 'string' ? { id: config } : config
  const options = Object.assign(defaultConfig, configData)

  if (!options.id && window.self == window.top) {
    throw new Error('iframe is empty')
  }
  let iframeNode: any = null

  // parent window
  if (options.id) {
    iframeNode = typeof options.id === 'string' ? document.getElementById(options.id) : options.id
    if (iframeNode.nodeName !== 'IFRAME' || !iframeNode.src) {
      throw new Error('iframe is must')
    }
    const iframeURL = new URL(iframeNode.src)
    options.origin = iframeURL.origin
  }

  const postMessage = (data, origin) => (iframeNode ? iframeNode.contentWindow : window.top).postMessage(data, origin)
  
  const proxyMap = {}

  // 监听信息通信
  window.addEventListener('message', async (event) => {
    const { __func, __cb, data, error } = event.data || {}
    if (__cb) {
      // 被调用
      if (typeof proxyMap[__func] === 'function') {
        try {
          const res = await proxyMap[__func](...data)
          if (res instanceof Error) postMessage({ __func: __cb, error: res }, event.origin)
          else postMessage({ __func: __cb, data: res }, event.origin)
        } catch (err) {
          postMessage({ __func: __cb, error: err }, event.origin)
        }
      } else {
        postMessage({ __func: __cb, error: new Error('function is null') }, event.origin)
      }
    } else if (__func) {
      // 调用后回调
      if (typeof proxyMap[__func] === 'object') {
        // 接受同域下回调
        const { resolve, reject, cb } = proxyMap[__func]
        error ? reject(error) : resolve(data)
        delete proxyMap[cb]
      }
    }
  })

  return new Proxy(proxyMap, {
    get (target, p, receiver) {
      return new Proxy(NOOP, {
        apply (thisTarget, thisArg, argArray) {
          return new Promise((resolve, reject) => {
            const __cb = cb()
            postMessage({
              __func: p,
              data: argArray,
              __cb
            }, options.origin)
            proxyMap[__cb] = { resolve, reject, cb: __cb }
            setTimeout(() => {
              reject(new Error('timeout'))
              delete proxyMap[__cb]
            }, options.timeout)
          })
        }
      })
    }
  })
}
