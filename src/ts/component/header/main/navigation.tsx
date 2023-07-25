import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, UtilObject, keyboard, sidebar, translate } from 'Lib';

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<I.HeaderComponent, object> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tabs, tab, onTab, onTooltipShow, onTooltipHide } = this.props;
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

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any, i: number) => (
							<div 
								key={i}
								className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
								onClick={() => onTab(item.id)}
								onMouseOver={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
								onMouseOut={onTooltipHide}
							>
								{item.name}
							</div>
						))}
					</div>
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