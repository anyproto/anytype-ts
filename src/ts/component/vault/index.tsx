import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { U, S, keyboard, translate, analytics, Storage } from 'Lib';

const Vault = observer(class Vault extends React.Component {
	
	node = null;

	constructor (props) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
	};

    render () {
		const items = this.getItems();
		const { spaceview } = S.Block;

		const Item = (item) => {
			const cn = [ 'item', 'space' ];
			const icon = item.isShared ? 'shared' : '';

			if (item.id == spaceview) {
				cn.push('isActive');
			};

			let descr = null;
			if (item.isPersonal) {
				descr = translate(`spaceAccessType${item.spaceAccessType}`);
			};

			return (
				<div 
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="iconWrap">
						<IconObject object={item} size={48} forceLetter={true} />
						{icon ? <Icon className={icon} /> : ''}
					</div>
					<div className="coverWrap">
						<IconObject object={item} size={360} forceLetter={true} />
					</div>
					<div className="infoWrap">
						<ObjectName object={item} />
						<div className="descr">
							{descr}
						</div>
					</div>
				</div>
			);
		};

		const ItemIcon = (item: any) => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
			>
				<div className="iconWrap" />
				<div className="infoWrap">
					<div className="name">{item.name}</div>
				</div>
			</div>
		);

		const ItemAdd = (item: any) => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
			>
				<div className="iconWrap" />
			</div>
		);

        return (
            <div 
				ref={node => this.node = node}
				id="vault"
				className="vault"
				onClick={this.onExpand}
            >
				<div className="items">
					{items.map(item => {
						item.key = `item-space-${item.id}`;

						let content = null;
						if (item.id == 'add') {
							content = <ItemAdd {...item} />;
						} else 
						if (item.id == 'gallery') {
							content = <ItemIcon {...item} />;
						} else {
							content = <Item {...item} />;
						};

						return content;
					})}
				</div>	
            </div>
		);
    };

	getItems () {
		const items = U.Common.objectCopy(U.Space.getList());

		items.push({ id: 'gallery', name: translate('commonGallery') });

		if (U.Space.canCreateSpace()) {
			items.push({ id: 'add', name: translate('commonCreateNew') });
		};

		return items;
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		if (item.id == 'add') {
			this.onAdd();
		} else
		if (item.id == 'gallery') {
			S.Popup.open('usecase', {});
		} else {
			U.Router.switchSpace(item.targetSpaceId);
			analytics.event('SwitchSpace');
		};
	};

	onAdd () {
		S.Popup.open('settings', { 
			className: 'isSpaceCreate',
			data: { 
				page: 'spaceCreate', 
				isSpace: true,
				onCreate: (id) => {
					U.Router.switchSpace(id, '', () => Storage.initPinnedTypes());
					analytics.event('SwitchSpace');
				},
			}, 
		});
	};

	onContextMenu (e: any, item: any) {
		U.Menu.spaceContext(item, {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			route: analytics.route.navigation,
		});
	};

	onExpand () {
		const { wh } = U.Common.getWindowDimensions();
		const node = $(this.node);
		const container = $('#vaultContentContainer');
		const isExpanded = node.hasClass('isExpanded');

		node.toggleClass('isExpanded');
		container.toggleClass('isExpanded');
		container.css({ height: !isExpanded ? wh : '' });
	};

});

export default Vault;