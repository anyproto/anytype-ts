import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, UtilObject, keyboard, sidebar, translate } from 'Lib';
import { popupStore } from 'Store';

interface Props extends I.HeaderComponent {
	text: string;
	layout: I.ObjectLayout;
};

const HeaderMainEmpty = observer(class HeaderMainEmpty extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const cmd = keyboard.cmdSymbol();

		return (
			<React.Fragment>
				<div className="side left">
					<Icon
						className="toggle big"
						tooltip={translate('sidebarToggle')}
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand big" tooltip={translate('commonOpenObject')} onClick={this.onOpen} />
				</div>

				<div className="side center" />
				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen () {
		popupStore.closeAll(null, () => {
			UtilObject.openRoute({ layout: this.props.layout });
		});
	};

});

export default HeaderMainEmpty;