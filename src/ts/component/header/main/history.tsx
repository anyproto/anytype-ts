import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';
import { DataUtil } from '../../../lib';

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

@observer
class HeaderMainHistory extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onRestore = this.onRestore.bind(this);
	};

	render () {
		return (
			<div className="header headerMainHistory">
				<div className="side left">
					<div className="item grey" onClick={this.onBack}>
						<Icon className="arrow" />Current version
					</div>
				</div>

				<div className="side center">
					<div className="item">18 July 2020, 16:02</div>
				</div>

				<div className="side right" onClick={this.onRestore}>
					<div className="item orange">Restore version</div>
				</div>
			</div>
		);
	};

	onBack(e: any) {
		const { rootId } = this.props;
		DataUtil.pageOpen(e, rootId);
	};

	onRestore (e: any) { 
	};

};

export default HeaderMainHistory;