import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';

interface Props extends RouteComponentProps<any>  {};

const Constant = require('json/constant.json');

class HeaderMainIndex extends React.Component<Props, {}> {
	
	render () {
		return (
			<div className="header">
				<Icon className="logo" />
			</div>
		);
	};
	
};

export default HeaderMainIndex;