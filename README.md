# iframe-rpc-util

[![npm](https://img.shields.io/npm/v/iframe-rpc-util.svg)](https://www.npmjs.com/package/iframe-rpc-util)

RPC between cross-origin iframe using postMessage

## Installation


```shell
$ npm install iframe-rpc-util

$ yarn add iframe-rpc-util

$ pnpm install iframe-rpc-util
```

## Usage

### Parent Iframe

```html
<iframe src="xx" id="iframeNode"></iframe>
```

```js
import iframeRpc from 'iframe-rpc-util'

// init rpc instance
const iframeProxy = iframeRpc('iframeNode')

// iframe init event
iframeProxy.onInit = (data) => {
    // get rpc register function
    iframeProxy.getKeys().then((data) => {
        console.log('parent getKeys', data)
    })

    // call children function
    iframeProxy.childrenFunc('parent params').then((data) => {
        console.log('parent', data)
    })
}

// register function
iframeProxy.parentFunc = (data) => {
    // return remote data
    return 'parent function'
}
```


### Children Iframe

```js
import iframeRpc from 'iframe-rpc-util'

const iframeProxy = iframeRpc()

// register function
iframeProxy.childrenFunc = (data) => {
    // return remote data
    return 'children function'
}

iframeProxy.parentFunc('children params').then((data) => {
    console.log('children', data)
})
```


### If you like it, please star it
