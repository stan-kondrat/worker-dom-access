import {guid, IProxyAnswer, IProxyArg, IProxyRequest, isPlainObject, isPrimitive} from './proxy';

export class TargetProxy {
    private objects = new Map<string, any>();
    private callbacks = new Map<string, any>();

    constructor(private worker) {
        const onmessage = this.worker.onmessage;
        this.worker.onmessage = (...args) => {
            if (onmessage) {
                onmessage.apply(null, args);
            }
            this.onMessage.apply(this, args);
        };
    }

    public register(name, object) {
        this.objects.set(name, object);
    }

    private onMessage({data}) {
        const message: IProxyRequest = data;

        if (!(message && message.objectId && message.type && message.type === 'proxy')) {
            return;
        }

        const target = this.objects.get(message.objectId);

        if (!target) {
            return;
        }

        this[message.action].apply(this, [target, message.requestId, message.args]);
    }

    private setAction(target, requestId, [property, value]) {
        value = this.convertFromProxy(value);
        target[property] = value;
        const answer: IProxyAnswer = { requestId, type: 'plain' };
        this.worker.postMessage(answer);
    }

    private getAction(target, requestId, [property]) {
        const result = target[property];
        this.register(requestId, result);
        let answer: IProxyAnswer;
        if (typeof result === 'function'
            || (typeof result === 'object' && result !== null && !isPlainObject(result))) {
            answer = {requestId, type: 'proxy'};

        } else {
            answer = {requestId, type: 'plain', result};
        }

        this.worker.postMessage(answer);
    }

    private applyAction(target, requestId, [args]) {
        args = args.map((arg) => this.convertFromProxy(arg));
        const result = target.apply(null, args);
        this.register(requestId, result);
        let answer: IProxyAnswer;
        if (typeof result === 'function'
            || (typeof result === 'object' && result !== null && !isPlainObject(result))) {
            answer = {requestId, type: 'proxy'};

        } else {
            answer = {requestId, type: 'plain', result};
        }
        this.worker.postMessage(answer);
    }

    private convertFromProxy(value: IProxyArg): any {
        if (value.type === 'plain') {
            return value.value;

        } else  if (value.type === 'function') {
            const callbackId = value.value;
            const callback = (...args) => {
                const result = args.map((arg) => this.convertToProxy(arg));
                const answer: IProxyAnswer = {requestId: callbackId, type: 'function', result};
                this.worker.postMessage(answer);
            };
            this.callbacks.set(callbackId, callback);
            return callback;

        } else  if (value.type === 'proxy') {
            return value.value;
        }
    }

    private convertToProxy(obj: any): IProxyArg {
        if (isPrimitive(obj) || isPlainObject(obj)) {
            return {type: 'plain', value: obj};

        } else if (typeof obj === 'function') {
            const callbackId = guid();
            this.callbacks.set(callbackId, obj);
            return {type: 'function', value: callbackId};

        } else {
            const objectId = guid();
            this.objects.set(objectId, obj);
            return {type: 'proxy', value: objectId};
        }
    }
}
