import * as React from 'react';
import { observer } from 'mobx-react';
import { I, UtilObject } from 'Lib';

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<I.HeaderComponent, object> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { renderLeftIcons, renderTabs } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons(this.onOpen)}
				</div>

				<div className="side center">
					{renderTabs()}
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen () {
		UtilObject.openRoute({ rootId: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};

});

export default HeaderMainNavigation;