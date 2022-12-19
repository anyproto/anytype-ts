import * as React from 'react';
import { Loader, Frame } from 'Component';
import { I, ObjectUtil } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

const PageMainCreate = observer(class PageMainCreate extends React.Component<Props, object> {

	render () {
		return (
			<Frame>
				<Loader id="loader" />
			</Frame>
		);
	};
	
	componentDidMount () {
		ObjectUtil.create('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			ObjectUtil.openRoute({ id: message.targetId });
		});
	};

});

export default PageMainCreate;