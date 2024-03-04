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
		UtilObject.create('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			UtilObject.openRoute(message.details);
		});
	};

});

export default PageMainCreate;
