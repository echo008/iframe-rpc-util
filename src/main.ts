const NOOP = (): void => {}
const cb = (): string => `__${(Date.now()).toString(36)}${Math.random().toString(36).slice(-6)}__`
const filterCb = (name: string): boolean => name.length !== 18 || !name.startsWith('__') || !name.endsWith('__')

interface IframeConfig {
  id?: string | HTMLIFrameElement
  timeout: number,
  origin: string
}

type ConfigParams = string | Object | undefined

interface IframePromise {
  resolve: any,
  reject: any,
  cb: string
}

interface IframeProxy {
  [key: string]: Function | IframePromise
}

const defaultConfig: IframeConfig = {
  timeout: 3e3,
  origin: '*'
}

export default (config: ConfigParams) => {
  const configData = typeof config === 'string' ? { id: config } : config
  const options: IframeConfig = Object.assign(defaultConfig, configData)

  if (!options.id && window.self == window.top) {
    throw new Error('iframe is empty')
  }

  let iframeNode: HTMLIFrameElement | null = null

  const postMessage = (data, origin) => ((iframeNode ? iframeNode.contentWindow : window.top) as Window).postMessage(data, origin)
  
  const proxyMap: IframeProxy = {}

  if (options.id) {
    // parent window
    iframeNode = (typeof options.id === 'string' ? document.getElementById(options.id) : options.id) as HTMLIFrameElement
    if (iframeNode.nodeName !== 'IFRAME' || !iframeNode.src) {
      throw new Error('iframe is must')
    }
    const iframeURL = new URL(iframeNode.src)
    options.origin = iframeURL.origin
  } else {
    // children window
    Promise.resolve().then(() => {
      postMessage({
        __func: 'onReady',
        data: Object.keys(proxyMap).filter(filterCb)
      }, options.origin)
    })
  }

  // 监听信息通信
  window.addEventListener('message', async (event) => {
    const { __func, __cb, data, error } = event.data || {}
    if (__cb) {
      // 被调用
      if (typeof proxyMap[__func] === 'function') {
        try {
          const res = await (proxyMap[__func] as Function)(...data)
          if (res instanceof Error) postMessage({ __func: __cb, error: res }, event.origin)
          else postMessage({ __func: __cb, data: res }, event.origin)
        } catch (err) {
          postMessage({ __func: __cb, error: err }, event.origin)
        }
      } else if (__func === 'getKeys') {
        postMessage({ __func: __cb, data: Object.keys(proxyMap).filter(filterCb) }, event.origin)
      } else {
        postMessage({ __func: __cb, error: new Error('function is null') }, event.origin)
      }
    } else if (__func) {
      // 调用后回调
      if (typeof proxyMap[__func] === 'object') {
        // 接受同域下回调
        const { resolve, reject, cb } = proxyMap[__func] as IframePromise
        error ? reject(error) : resolve(data)
        delete proxyMap[cb]
      } else if (__func === 'onReady') {
        (proxyMap[__func] as Function)(data)
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