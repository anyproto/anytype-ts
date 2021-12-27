import * as React from 'react';
import { I, Action } from 'ts/lib';
import { PreviewObject } from 'ts/component';

interface Props extends I.Menu {};

class MenuPreviewObject extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		return (
			<PreviewObject key={'objectPreview-' + rootId} rootId={rootId} />
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
