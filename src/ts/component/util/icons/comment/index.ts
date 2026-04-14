import { registerIcon } from '../registry';
import './menu';
import Discussion from './discussion';
import Send from './send';
import Slash from './slash';
import Reaction from './reaction';
import Mention from './mention';

registerIcon('comment/discussion', Discussion);
registerIcon('comment/send', Send);
registerIcon('comment/slash', Slash);
registerIcon('comment/reaction', Reaction);
registerIcon('comment/mention', Mention);
