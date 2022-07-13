import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Loader, Frame } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};

const PageMainCreate = observer(class PageMainStore extends React.Component<Props, {}> {

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