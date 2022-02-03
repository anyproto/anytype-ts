import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { C, Util, DataUtil, I, translate, analytics } from 'ts/lib';
import { detailStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

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
			<div id="header" className="header headerMainHistory">
				<div className="side left">
					<div className="item grey" onClick={this.onBack}>
						<Icon className="arrow" />{translate('headerHistoryCurrent')}
					</div>
				</div>

				<div className="side center">
					{version ? <div className="item">{Util.date('d F Y H:i:s', version.time)}</div> : ''}
				</div>

				<div className="side right" onClick={this.onRestore}>
					<div className="item orange">{translate('headerHistoryRestore')}</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
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

	resize () {
		const { isPopup } = this.props;
		const { sidebar } = commonStore;
		const { width } = sidebar;

		Util.resizeSidebar(width, isPopup);
	};

});

export default HeaderMainHistory;