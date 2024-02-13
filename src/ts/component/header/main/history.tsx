import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { C, UtilDate, UtilObject, I, translate, analytics } from 'Lib';
import { detailStore } from 'Store';

interface State {
	version: I.HistoryVersion;
};

const HeaderMainHistory = observer(class HeaderMainHistory extends React.Component<I.HeaderComponent, State> {

	state = {
		version: null,
	};

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onRestore = this.onRestore.bind(this);
	};

	render () {
		const { version } = this.state;
		const canWrite = UtilObject.canParticipantWrite();

		return (
			<React.Fragment>
				<div className="side left">
					<div className="item grey" onClick={this.onBack}>
						<Icon className="arrow" />{translate('headerHistoryCurrent')}
					</div>
				</div>

				<div className="side center">
					<div className="txt">
						{version ? UtilDate.date('d F Y H:i:s', version.time) : ''}
					</div>
				</div>

				<div className="side right" onClick={this.onRestore}>
					{canWrite ? <div className="item orange">{translate('headerHistoryRestore')}</div> : ''}
				</div>
			</React.Fragment>
		);
	};

	onBack (e: any) {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		UtilObject.openEvent(e, object);
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
			UtilObject.openEvent(e, object);

			analytics.event('RestoreFromHistory');
		});
	};

	setVersion (version: I.HistoryVersion) {
		this.setState({ version });
	};

});

export default HeaderMainHistory;