import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, ObjectUtil } from 'Lib';
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
		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
				</div>

				<div className="side center" />
				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen () {
		popupStore.closeAll(null, () => {
			ObjectUtil.openRoute({ layout: this.props.layout });
		});
	};

});

export default HeaderMainEmpty;