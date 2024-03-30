import * as React from 'react';
import { observer } from 'mobx-react';
import { I, UtilObject } from 'Lib';
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
		const { renderLeftIcons } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons(this.onOpen)}
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