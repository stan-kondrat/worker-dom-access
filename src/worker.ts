import { WorkerProxyObject } from './proxy/worker';

console.warn('Init Worker');

const window: any = WorkerProxyObject('window');

window.document.body.innerText = 'Click me!';

window.document.body.addEventListener('click', async (mouseEvent) => {
    const screenX = await mouseEvent.screenX;
    window.alert('Hello From Worker! MouseEvent.screenX=' + screenX);
}, false);
