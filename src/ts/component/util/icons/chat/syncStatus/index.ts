import { registerIcon } from '../../registry';
import Error from './error';
import Syncing from './syncing';

registerIcon('chat/syncStatus/error', Error);
registerIcon('chat/syncStatus/syncing', Syncing);
registerIcon('chat/syncStatus/queued', Syncing);
