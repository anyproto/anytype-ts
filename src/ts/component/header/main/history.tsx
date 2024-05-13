import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { C, UtilDate, UtilObject, I, translate, analytics, UtilSpace, keyboard } from 'Lib';
import { detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

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
		this.onRelation = this.onRelation.bind(this);
	};

	render () {
		const { rootId, renderLeftIcons } = this.props;
		const { version } = this.state;
		const cmd = keyboard.cmdSymbol();
		const object = detailStore.get(rootId, rootId, []);
		const showMenu = !UtilObject.isTypeOrRelationLayout(object.layout);
		const canWrite = UtilSpace.canMyParticipantWrite();

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons()}
				</div>

				<div className="side center">
					<div className="txt">
						{version ? UtilDate.date('M d, Y g:i:s A', version.time) : ''}
					</div>
				</div>

				<div className="side right">
					{canWrite ? <div className="item orange" onClick={this.onRestore}>{translate('headerHistoryRestore')}</div> : ''}
					{showMenu ? <Icon id="button-header-relation" tooltip="Relations" tooltipCaption={`${cmd} + Shift + R`} className="relation" onClick={this.onRelation} /> : ''}
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

	onRelation () {
		this.props.onRelation({}, { readonly: true });
	};

	setVersion (version: I.HistoryVersion) {
		this.setState({ version });
	};

});

export default HeaderMainHistory;