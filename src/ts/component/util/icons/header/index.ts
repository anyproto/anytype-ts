import React from 'react';
import { registerIcon } from '../registry';
import AnyName from './anyName';
import Graph from './graph';
import Language from './language';
import Invite from './invite';
import Logout from './logout';
import OneToOne from './oneToOne';
import Pin from './pin';
import Relation from './relation';
import Search from './search';
import Settings from './settings';
import Widget from './widget';

const PinFilled = (props: React.SVGProps<SVGSVGElement>) => React.createElement(Pin, { ...props, filled: true });

registerIcon('header/anyName', AnyName);
registerIcon('header/graph', Graph);
registerIcon('header/invite', Invite);
registerIcon('header/language', Language);
registerIcon('header/logout', Logout);
registerIcon('header/oneToOne', OneToOne);
registerIcon('header/pin0', Pin);
registerIcon('header/pin1', PinFilled);
registerIcon('header/relation', Relation);
registerIcon('header/search', Search);
registerIcon('header/settings', Settings);
registerIcon('header/widget', Widget);
