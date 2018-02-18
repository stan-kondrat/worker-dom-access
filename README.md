# Access DOM in Web Worker


index.js
```js
// Create Web Worker
const worker = new Worker('worker.js');

// Create proxy
const targetProxy = new TargetProxy(worker);

// Gave access to window object
targetProxy.register('window', window);
```

worker.js
```js
// link proxy object
const window: any = WorkerProxyObject('window');

// eval native alert function in GUI thread from worker thread
window.alert('Hello From Worker');

// direct access to DOM from worker
window.document.body.innerText = 'Hello From Worker';
```

## How it works
In two words [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) & [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
For more details, please see [worker.ts](https://github.com/stan-kondrat/worker-dom-access/blob/master/src/proxy/worker.ts) file (less than 100 lines of code).

### Fell free to conribute 
