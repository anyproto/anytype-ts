import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { I, Util, crumbs } from 'ts/lib';
import { blockStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const $ = require('jquery');

@observer
class HeaderMainSet extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onNavigation = this.onNavigation.bind(this);

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const cn = [ 'header', 'headerMainEdit' ];

		if (popupStore.isOpen('navigation')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				<div className="side left">
					<Icon className="home big" tooltip="Home" onClick={this.onHome} />
					<Icon className="back big" tooltip="Back" onClick={this.onBack} />
					<Icon className="forward big" tooltip="Forward" onClick={this.onForward} />
					<Icon className="nav big" tooltip="Navigation" onClick={(e: any) => { this.onNavigation(e); }} />
				</div>

				<div className="side center">
					<div className="path" onMouseDown={(e: any) => { this.onSearch(e); }} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
						<div className="item">
							<IconObject object={{ iconClass: 'newSet' }} />
							<div className="name">New set</div>
						</div>
					</div>
				</div>

				<div className="side right">
				</div>
			</div>
		);
	};

	onHome (e: any) {
		this.props.history.push('/main/index');
	};
	
	onBack (e: any) {
		crumbs.restore(I.CrumbsType.Page);
		this.props.history.goBack();
	};
	
	onForward (e: any) {
		crumbs.restore(I.CrumbsType.Page);
		this.props.history.goForward();
	};
	
	onNavigation (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { root } = blockStore;

		popupStore.open('navigation', {
			preventResize: true, 
			data: {
				rootId: root,
				type: I.NavigationType.Go, 
			},
		});
	};

	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { root } = blockStore;

		popupStore.open('search', {
			preventResize: true, 
			data: {
				rootId: root,
				type: I.NavigationType.Go, 
			},
		});
	};

	onPathOver () {
		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to search', path, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide(false);
	};
	
};

export default HeaderMainSet;