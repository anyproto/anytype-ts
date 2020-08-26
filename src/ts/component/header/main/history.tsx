import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

@observer
class HeaderMainHistory extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div className="header headerMainHistory">
				<div className="side left">
					left
				</div>

				<div className="side center">
					mid
				</div>

				<div className="side right">
					right
				</div>
			</div>
		);
	};
};

export default HeaderMainHistory;