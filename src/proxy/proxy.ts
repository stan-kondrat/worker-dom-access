export interface IProxyRequest {
    type: string; // 'proxy'
    objectId: string;
    requestId: string;
    action: string;
    args: any[];
}

export interface IProxyAnswer {
    requestId: string;
    type: string; // 'proxy' | 'plain'
    result?: string;
}

export interface IDeferred {
    resolve: any;
    reject: any;
    promise: Promise<any>;
}

export class Deferred implements IDeferred {
    public resolve;
    public reject;
    public promise;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        Object.freeze(this as any);
    }
}

export function isPlainObject(obj) {
    if (Object.prototype.toString.call(obj) !== '[object Object]') { return false; }
    if (typeof obj.constructor !== 'function') { return false; }
    if (Object.prototype.toString.call(obj.constructor.prototype) !== '[object Object]') { return false; }
    if (obj.constructor.prototype.hasOwnProperty('isPrototypeOf') === false) {
        return false;
    }
    return true;
}

export function guid() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
