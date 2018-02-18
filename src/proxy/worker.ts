import {Deferred, guid, IDeferred, IProxyAnswer, IProxyRequest} from './proxy';

const requests = new Map<string, IDeferred>();
const objects = new Map<string, any>();

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

    const request = requests.get(message.requestId);

    if (!request) {
        return;
    }
    requests.delete(message.requestId);

    if (message.type === 'plain') {
        request.resolve(message.result);
    } else if (message.type === 'proxy') {
        request.resolve(objects.get(message.requestId));
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
    postMessage(target.parentId, 'setAction', [name, value]);
    return true;
}

function applyAction(target, thisValue, args) {
    return postMessage(target.parentId, 'applyAction', [args]);
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
