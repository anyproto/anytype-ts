import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainSet extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div className="wrapper">
				<Icon className="new" />
			</div>
		);
	};
	
};

export default PageMainSet;