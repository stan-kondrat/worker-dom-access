import {TargetProxy} from './proxy/target';

console.log('Init Target');

const worker = new Worker('worker.js');

const targetProxy = new TargetProxy(worker);
targetProxy.register('window', window);
