import * as React from 'react';
import { Loader, Frame } from 'Component';
import { I, UtilObject } from 'Lib';
import { observer } from 'mobx-react';

const PageMainCreate = observer(class PageMainCreate extends React.Component<I.PageComponent> {

	render () {
		return (
			<Frame>
				<Loader id="loader" />
			</Frame>
		);
	};
	
	componentDidMount () {
		const flags = [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ];
		UtilObject.create('', '', {}, I.BlockPosition.Bottom, '', {}, flags, '', message => UtilObject.openRoute(message.details));
	};

});

export default PageMainCreate;
