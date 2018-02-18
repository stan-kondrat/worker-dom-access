import { WorkerProxyObject } from './proxy/worker';

console.warn('Init Worker');

const window: any = WorkerProxyObject('window');
window.alert('Hello From Worker');
window.document.body.innerText = 'Hello From Worker';
