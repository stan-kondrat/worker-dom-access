import {IProxyAnswer, IProxyRequest, isPlainObject} from './proxy';

export class TargetProxy {
    private objects = new Map<string, any>();

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
}
