import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { C, UtilDate, UtilObject, I, translate, analytics, UtilSpace, keyboard } from 'Lib';
import { detailStore, popupStore } from 'Store';

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
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { renderLeftIcons } = this.props;
		const { version } = this.state;
		const canWrite = UtilSpace.canMyParticipantWrite();

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons(this.onOpen)}
				</div>

				<div className="side center">
					<div className="txt">
						{version ? UtilDate.date('M d, Y g:i:s A', version.time) : ''}
					</div>
				</div>

				<div className="side right" onClick={this.onRestore}>
					{canWrite ? <div className="item orange">{translate('headerHistoryRestore')}</div> : ''}
				</div>
			</React.Fragment>
		);
	};

	onOpen () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		keyboard.disableClose(true);
		popupStore.closeAll(null, () => UtilObject.openRoute({ ...object, layout: I.ObjectLayout.History }));
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