import { registerIcon } from '../../registry';
import Error from './error';
import LocalOnly from './localOnly';
import Queued from './queued';
import Synced from './synced';
import Syncing from './syncing';

registerIcon('menu/syncStatus/error', Error);
registerIcon('menu/syncStatus/localOnly', LocalOnly);
registerIcon('menu/syncStatus/queued', Queued);
registerIcon('menu/syncStatus/synced', Synced);
registerIcon('menu/syncStatus/syncing', Syncing);
