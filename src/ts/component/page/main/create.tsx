import * as React from 'react';
import { Loader, Frame } from 'Component';
import { I, DataUtil } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

const PageMainCreate = observer(class PageMainCreate extends React.Component<Props, {}> {

	render () {
		return (
			<Frame>
				<Loader id="loader" />
			</Frame>
		);
	};
	
	componentDidMount () {
		DataUtil.pageCreate('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			DataUtil.objectOpenRoute({ id: message.targetId });
		});
	};

});

export default PageMainCreate;