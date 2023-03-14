import * as React from 'react';
import $ from 'jquery';
import { Icon, IconObject } from 'Component';
import { authStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
import { I, DataUtil, translate, Util } from 'Lib';

const MENU_ID = 'threadStatus';

const MenuThreadList = observer(class MenuThreadList extends React.Component<I.Menu> {

	node: any = null;
	timeoutMenu = 0;
	timeoutClose = 0;

	constructor (props: I.Menu) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const thread = authStore.threadGet(rootId);
		const accounts = thread.accounts || [];
		const cafe = thread.cafe || {};
		const status = cafe.status || I.ThreadStatus.Unknown;

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onMouseEnter(item.id, false); }}
			>
				<IconObject object={{ ...item, layout: I.ObjectLayout.Human }} />
				<div className="info">
					<div className="name">{item.name}</div>
					<div className="description">
						<div className="side left">Last sync</div>
						<div className="side right">
							{Util.timeAgo(Math.max(item.lastPulled, item.lastEdited))}
						</div>
					</div>
				</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="items"
			>
				<div 
					id="item-cafe" 
					className="item" 
					onMouseOver={(e: any) => { this.onMouseEnter('cafe', true); }} 
				>
					<Icon className="cafe" />
					<div className="info">
						<div className="name">Backup node</div>
						<div className={[ 'description', DataUtil.threadColor(status) ].join(' ')}>
							{translate('syncStatus' + status)}
						</div>
					</div>
				</div>
				{(accounts || []).map((item: I.ThreadAccount, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { getId } = this.props;
		const obj = $('#' + getId());
		
		const clear = () => {
			window.clearTimeout(this.timeoutClose);
			window.clearTimeout(this.timeoutMenu);
		};

		const leave = () => {
			clear();
			this.timeoutClose = window.setTimeout(() => {
				clear();
				menuStore.close(this.props.id);
				menuStore.close('threadStatus');
			}, 1000);
		};

		obj.off('mouseenter').on('mouseenter', () => { clear(); });
		obj.off('mouseleave').on('mouseleave', () => {
			const status = $('#menuThreadStatus');

			if (status.length) {
				status.off('mouseenter').on('mouseenter', () => { clear(); });
				status.off('mouseleave').on('mouseleave', leave);
			};

			leave();
		});
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeoutClose);
		window.clearTimeout(this.timeoutMenu);

		menuStore.close(MENU_ID);
	};

	onMouseEnter (id: string, isCafe: boolean) {
		if (!id) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;
		const node = $(this.node);
		const item = node.find('#item-' + id);

		if (!item.length) {
			return;
		};

		const top = item.offset().top - $(window).scrollTop();
		const cnw = [ 'fixed' ];
		
		if (classNameWrap) {
			cnw.push(classNameWrap);
		};

		if (!menuStore.isOpen(MENU_ID, id)) {
			menuStore.close(MENU_ID, () => {
				menuStore.open(MENU_ID, {
					menuKey: id,
					element: `#${getId()} #item-${id}`,
					horizontal: I.MenuDirection.Right,
					offsetX: getSize().width,
					fixedY: top,
					classNameWrap: cnw.join(' '),
					noDimmer: true,
					data: {
						...data,
						accountId: id,
						isCafe,
					},
				});
			});
		};
	};
	
});

export default MenuThreadList;