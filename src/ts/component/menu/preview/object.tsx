import * as React from 'react';
import { I, Action } from 'ts/lib';
import { ObjectPreviewBlock } from 'ts/component';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

class MenuPreviewObject extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		return (
			<ObjectPreviewBlock key={'objectPreview-' + rootId} rootId={rootId} />
		);
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		Action.pageClose(rootId, false);
	};

};

export default MenuPreviewObject;
