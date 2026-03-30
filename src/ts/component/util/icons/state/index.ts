import { registerIcon } from '../registry';
import VoidError from './error';
import VoidSelect from './select';
import DragState from './dragState';

registerIcon('state/error', VoidError);
registerIcon('state/select', VoidSelect);
registerIcon('state/drag', DragState);
