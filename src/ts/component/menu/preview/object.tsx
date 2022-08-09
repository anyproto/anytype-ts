import * as React from 'react';
import { I } from 'Lib';
import { PreviewObject } from 'Component';

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

};

export default MenuPreviewObject;
