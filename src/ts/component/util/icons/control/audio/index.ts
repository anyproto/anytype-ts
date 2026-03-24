import { registerIcon } from '../../registry';
import Play from './play';
import Pause from './pause';
import Volume from './volume';
import Mute from './mute';

registerIcon('control/audio/play', Play);
registerIcon('control/audio/pause', Pause);
registerIcon('control/audio/volume', Volume);
registerIcon('control/audio/mute', Mute);
