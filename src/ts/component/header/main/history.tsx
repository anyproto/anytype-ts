import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, keyboard } from 'Lib';

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
		this.onRelation = this.onRelation.bind(this);
	};

	render () {
		const { rootId, renderLeftIcons } = this.props;
		const { version } = this.state;
		const cmd = keyboard.cmdSymbol();
		const object = S.Detail.get(rootId, rootId, []);
		const showMenu = !U.Object.isTypeOrRelationLayout(object.layout);

		return (
			<React.Fragment>
				<div className="side left">{renderLeftIcons()}</div>

				<div className="side center">
					<div className="txt">
						{version ? U.Date.date('M d, Y g:i:s A', version.time) : ''}
					</div>
				</div>

				<div className="side right">
					{showMenu ? <Icon id="button-header-relation" tooltip="Relations" tooltipCaption={`${cmd} + Shift + R`} className="relation withBackground" onClick={this.onRelation} /> : ''}
				</div>
			</React.Fragment>
		);
	};

	onBack (e: any) {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, []);

		U.Object.openEvent(e, object);
	};

	onRelation () {
		this.props.onRelation({}, { readonly: true });
	};

	setVersion (version: I.HistoryVersion) {
		this.setState({ version });
	};

});

export default HeaderMainHistory;