import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';
import { C, Util, DataUtil, I, translate } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	version: I.Version;
};

@observer
class HeaderMainHistory extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onRestore = this.onRestore.bind(this);
	};

	render () {
		const { version } = this.props;

		return (
			<div className="header headerMainHistory">
				<div className="side left">
					<div className="item grey" onClick={this.onBack}>
						<Icon className="arrow" />{translate('headerHistoryCurrent')}
					</div>
				</div>

				<div className="side center">
					<div className="item">{Util.date('d F Y H:i:s', version.time)}</div>
				</div>

				<div className="side right" onClick={this.onRestore}>
					<div className="item orange">{translate('headerHistoryRestore')}</div>
				</div>
			</div>
		);
	};

	onBack(e: any) {
		const { rootId } = this.props;
		DataUtil.pageOpen(rootId);
	};

	onRestore (e: any) {
		const { rootId, version } = this.props;

		C.HistorySetVersion(rootId, version.id, (message: any) => {
			DataUtil.pageOpen(rootId);
		});
	};

};

export default HeaderMainHistory;