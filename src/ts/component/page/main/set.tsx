import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, HeaderMainSet as Header } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainSet extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<Icon className="new" />
				</div>
			</div>
		);
	};
	
};

export default PageMainSet;