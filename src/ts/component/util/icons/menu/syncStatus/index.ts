import { registerIcon } from '../../registry';
import Failed from './failed';
import Loading from './loading';
import LocalOnly from './localOnly';
import Ok from './ok';
import Queued from './queued';

registerIcon('menu/syncStatus/failed', Failed);
registerIcon('menu/syncStatus/loading', Loading);
registerIcon('menu/syncStatus/localOnly', LocalOnly);
registerIcon('menu/syncStatus/ok', Ok);
registerIcon('menu/syncStatus/queued', Queued);
