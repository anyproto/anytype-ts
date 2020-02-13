import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Block, RouteComponentProps<any> {
	rootId: string;
};

@observer
class BlockCover extends React.Component<Props, {}> {
	
	render() {
		return (
			<div>
			</div>
		);
	};
	
};

export default BlockCover;