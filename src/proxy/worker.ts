import {Deferred, guid, IDeferred, IProxyAnswer, IProxyArg, IProxyRequest, isPlainObject, isPrimitive} from './proxy';

const requests = new Map<string, IDeferred>();
const objects = new Map<string, any>();
const callbacks = new Map<string, any>();

const dedicatedWorkerGlobalScope: any = self;

const onmessage = dedicatedWorkerGlobalScope.onmessage;
dedicatedWorkerGlobalScope.onmessage = (...args) => {
    if (onmessage) {
        onmessage.apply(null, args);
    }
    onMessage.apply(null, args);
};

function onMessage({data}) {
    const message: IProxyAnswer = data;

    if (!(message.type && message.requestId)) {
        return;
    }

    if (message.type === 'plain') {
        const request = requests.get(message.requestId);
        if (request) {
            requests.delete(message.requestId);
            request.resolve(message.result);
        }
    } else if (message.type === 'proxy') {
        const request = requests.get(message.requestId);
        if (request) {
            requests.delete(message.requestId);
            request.resolve(objects.get(message.requestId));
        }
    } else if (message.type === 'function') {
        const callback = callbacks.get(message.requestId);
        if (callback) {
            const args = message.result.map((arg) => convertfromProxy(arg));
            callback.apply(null, args);
        }
    }
}

function postMessage(objectId: string, action: string, args: any[]): any {
    const requestId = guid();
    const request: IProxyRequest = { type: 'proxy', objectId, requestId, action, args };
    dedicatedWorkerGlobalScope.postMessage(request);

    const deferred = new Deferred();
    requests.set(requestId, deferred);

    return WorkerProxyObject(requestId);
}

function getAction(target, name, receiver) {
    let result;
    if (name === 'then') {
        const request = requests.get(target.parentId);
        if (request) {
            result = (resolve, reject) => {
                return request.promise.then(resolve, reject);
            };
        }
    } else {
        result = postMessage(target.parentId, 'getAction', [name]);
    }
    return result;
}

function setAction(target, name, value) {
    const valueProxy = convertToProxy(value);
    postMessage(target.parentId, 'setAction', [name, valueProxy]);
    return true;
}

function applyAction(target, thisValue, args = []) {
    const argsProxy = args.map(convertToProxy);
    return postMessage(target.parentId, 'applyAction', [argsProxy]);
}

export function WorkerProxyObject(parentId: string) {
    let proxyObject = objects.get(parentId);
    if (!proxyObject) {
        const target: any = () => { /* */ };
        target.parentId = parentId;
        proxyObject = new Proxy(target, {
            get: getAction,
            set: setAction,
            apply: applyAction,
        });
        objects.set(parentId, proxyObject);
    }
    return proxyObject;
}

function convertToProxy(obj: any): IProxyArg {
    if (isPrimitive(obj) || isPlainObject(obj)) {
        return {type: 'plain', value: obj};

    } else if (typeof obj === 'function') {
        const callbackId = guid();
        callbacks.set(callbackId, obj);
        return {type: 'function', value: callbackId};

    } else {
        return {type: 'proxy', value: obj};
    }
}

function convertfromProxy(value: IProxyArg): any {
    if (value.type === 'plain') {
        return value.value;

    } else  if (value.type === 'function') {
        throw new Error('Not Implemented');

    } else  if (value.type === 'proxy') {

        const parentId = value.value;

        const target: any = () => { /* */ };
        target.parentId = parentId;
        const proxyObject = new Proxy(target, {
            get: getAction,
            set: setAction,
            apply: applyAction,
        });
        objects.set(parentId, proxyObject);
        return proxyObject;
    }
}
