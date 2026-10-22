import { ipcMain, webContents } from 'electron';
import { ChatStatusSession } from '../../src/ts/lib/chatStatus/session';
import { ChatStatusScope, StatusCommand, STATUS_CHANNEL, STATUS_UPDATE_CHANNEL } from '../../src/ts/lib/chatStatus/model';

export function registerChatStatus (): void {
	const clients = new Set<number>();
	const session = new ChatStatusSession((id, delta) => {
		const target = webContents.fromId(id);
		if (target && !target.isDestroyed()) target.send(STATUS_UPDATE_CHANNEL, delta);
	});
	ipcMain.on(STATUS_CHANNEL, (event, scope: ChatStatusScope, command: StatusCommand) => {
		const sender = event.sender;
		if (!clients.has(sender.id)) {
			clients.add(sender.id);
			const detach = () => session.removeClient(sender.id);
			sender.on('did-start-loading', detach);
			sender.on('render-process-gone', detach);
			sender.once('destroyed', () => { detach(); clients.delete(sender.id); });
		};
		session.receive(sender.id, scope, command);
	});
};
