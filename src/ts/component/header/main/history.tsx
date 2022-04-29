import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { C, Util, DataUtil, I, translate, analytics } from 'ts/lib';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>, I.HeaderComponent {};

interface State {
	version: I.HistoryVersion;
};

const HeaderMainHistory = observer(class HeaderMainHistory extends React.Component<Props, State> {

	state = {
		version: null,
	};

	constructor (props: any) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onRestore = this.onRestore.bind(this);
	};

	render () {
		const { version } = this.state;

		return (
			<React.Fragment>
				<div className="side left">
					<div className="item grey" onClick={this.onBack}>
						<Icon className="arrow" />{translate('headerHistoryCurrent')}
					</div>
				</div>

				<div className="side center">
					{version ? Util.date('d F Y H:i:s', version.time) : ''}
				</div>

				<div className="side right" onClick={this.onRestore}>
					<div className="item orange">{translate('headerHistoryRestore')}</div>
				</div>
			</React.Fragment>
		);
	};

	onBack (e: any) {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		DataUtil.objectOpenEvent(e, object);
	};

	onRestore (e: any) {
		e.persist();

		const { rootId } = this.props;
		const { version } = this.state;
		const object = detailStore.get(rootId, rootId, []);

		if (!version) {
			return;
		};

		C.HistorySetVersion(rootId, version.id, (message: any) => {
			DataUtil.objectOpenEvent(e, object);

			analytics.event('RestoreFromHistory');
		});
	};

	setVersion (version: I.HistoryVersion) {
		this.setState({ version });
	};

});

export default HeaderMainHistory;