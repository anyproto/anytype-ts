import * as React from 'react';
import { Loader, Frame } from 'Component';
import { I, U } from 'Lib';

class PageMainCreate extends React.Component<I.PageComponent> {

	render () {
		return (
			<Frame>
				<Loader id="loader" />
			</Frame>
		);
	};
	
	componentDidMount () {
		const flags = [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ];
		U.Object.create('', '', {}, I.BlockPosition.Bottom, '', flags, '', message => U.Object.openRoute(message.details));
	};

};

export default PageMainCreate;