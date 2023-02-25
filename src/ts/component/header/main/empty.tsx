import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, ObjectUtil, keyboard, sidebar } from 'Lib';
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
		const { text, onSearch, onForward, onBack, onTooltipShow, onTooltipHide } = this.props;
		
		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="toggleSidebar big" tooltip="Sidebar" onClick={() => sidebar.expand()} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
				</div>

				<div className="side center">
					<div 
						id="path" 
						className="path" 
						onClick={onSearch} 
						onMouseOver={e => onTooltipShow(e, 'Click to search')} 
						onMouseOut={onTooltipHide}
					>	
						<div className="inner">
							<div className="name">{text}</div>
						</div>
					</div>
				</div>

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