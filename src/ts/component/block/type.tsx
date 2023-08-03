import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, UtilData, UtilObject, UtilCommon, Onboarding, focus, keyboard, analytics, history as historyPopup, translate } from 'Lib';
import { popupStore, detailStore, blockStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const BlockType = observer(class BlockType extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;
	n = 0;
	isFocused = false;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onOut = this.onOut.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onTemplate = this.onTemplate.bind(this);
	};

	render (): any {
		const { block } = this.props;
		const items = this.getItems();
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		const Item = (item: any) => {
			return (
				<div 
					id={'item-' + item.id} 
					className="item" 
					onClick={(e: any) => { this.onClick(e, item); }} 
					onMouseEnter={(e: any) => { this.onOver(e, item); }} 
					onMouseLeave={this.onOut}
				>
					{item.icon ? <Icon className={item.icon} /> : ''}
					{item.name}
				</div>
			);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')} 
				tabIndex={0} 
				onFocus={this.onFocus} 
				onKeyDown={this.onKeyDown}
			>
				{items.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { isPopup } = this.props;
		this._isMounted = true;

		Onboarding.start('objectCreationStart', isPopup);
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getItems () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);
		const items = UtilData.getObjectTypesForNewObject({ withCollection: true, withDefault: true }).filter(it => it.id != object.type);

		items.push({ id: 'menu', icon: 'search', name: translate('blockTypeMyTypes') });

		return items;
	};

	onKeyDown (e: any) {
		if (menuStore.isOpen() || popupStore.isOpenKeyboard()) {
			return;
		};

		const { onKeyDown } = this.props;
		const items = this.getItems();
		const cmd = keyboard.cmdKey();

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowleft', e, () => {
			e.preventDefault();
			e.key = 'arrowup';

			this.n--;

			if (this.n < 0) {
				this.n = items.length - 1;
				this.setHover();

				if (onKeyDown) {
					onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
				};
			} else {
				this.setHover(items[this.n]);
			};
		});

		keyboard.shortcut('arrowdown, arrowright', e, () => {
			e.preventDefault();
			e.key = 'arrowdown';

			this.n++;

			if (this.n > items.length - 1) {
				this.n = 0;
				this.setHover();

				if (onKeyDown) {
					onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
				};
			} else {
				this.setHover(items[this.n]);
			};
		});

		keyboard.shortcut('enter, space', e, () => {
			e.preventDefault();

			if (items[this.n]) {
				this.onClick(e, items[this.n]);
			};
		});

		for (let i = 1; i <= 4; ++i) {
			keyboard.shortcut(`${cmd}+${i}`, e, () => {
				const item = items[(i - 1)];
				if (item) {
					this.onClick(e, item);
				};
			});
		};
	};
	
	onFocus () {
		if (this.isFocused) {
			return;
		};

		const items = this.getItems();
		if (items.length) {
			this.n = 0;
			this.setHover(items[this.n]);
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setHover(item);
		};
	};

	onOut () {
		if (!keyboard.isMouseDisabled) {
			this.setHover();
		};
	};

	setHover (item?: any) {
		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');
		if (item) {
			node.find('#item-' + item.id).addClass('hover');
		};

		this.isFocused = item ? true : false;
	};

	onMenu (e: any) {
		const { block } = this.props;
		const element = `#block-${block.id} #item-menu`;
		const obj = $(element);

		menuStore.open('typeSuggest', {
			element: `#block-${block.id} #item-menu`,
			onOpen: () => { obj.addClass('active'); },
			onClose: () => { 
				obj.removeClass('active'); 
				focus.apply();
			},
			data: {
				filter: '',
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts().concat([ I.ObjectLayout.Set ]) },
				],
				onClick: (item: any) => {
					this.onClick(e, item);
				}
			}
		});
	};

	onClick (e: any, item: any) {
		if (e.persist) {
			e.persist();
		};

		if (item.id == 'menu') {
			this.onMenu(e);
			return;
		};

		if (UtilObject.getSetTypes().includes(item.id)) {
			this.onObjectTo(item.id);
		} else {
			UtilData.checkTemplateCnt([ item.id ], (cnt: number) => {
				if (cnt) {
					popupStore.open('template', { 
						data: { 
							typeId: item.id, 
							onSelect: (template: any) => this.onCreate(item.id, template) 
						} 
					});
				} else {
					this.onCreate(item.id, null);
				};
			});
		};
	};

	onObjectTo (type: string) {
		const { rootId, isPopup, setLoading } = this.props;

		let layout: I.ObjectLayout = null;

		const cb = () => {
			if (isPopup) {
				historyPopup.clear();
			};

			keyboard.disableClose(true);
			UtilObject.openAuto({ id: rootId, layout }, { replace: true });
		};

		setLoading(true);

		switch (type) {
			case Constant.typeId.set: {
				layout = I.ObjectLayout.Set;
				C.ObjectToSet(rootId, [], cb);
				break;
			};

			case Constant.typeId.collection: {
				layout = I.ObjectLayout.Collection;
				C.ObjectToCollection(rootId, cb);
				break;
			};
		};
	};

	onCreate (typeId: any, template: any) {
		const { rootId, isPopup } = this.props;

		if (template) {
			C.ObjectApplyTemplate(rootId, template.id, this.onTemplate);
		} else {
			C.ObjectSetObjectType(rootId, typeId, this.onTemplate);
		};

		Onboarding.start('objectCreationFinish', isPopup);

		analytics.event('SelectObjectType', {
			objectType: typeId,
			layout: template?.layout,
			template: (template && template.templateIsBundled ? template.id : 'custom'),
		});
	};

	onBlock (id: string) {
		const { rootId, isPopup } = this.props;
		const block = blockStore.getFirstBlock(rootId, 1, it => it.isText());

		if (block) {
			const l = block.getLength();
			
			focus.set(block.id, { from: l, to: l });
			focus.apply();
		};

		UtilCommon.triggerResizeEditor(isPopup);
	};

	onTemplate () {
		const { rootId } = this.props;
		const first = blockStore.getFirstBlock(rootId, 1, it => it.isText());

		if (!first) {
			C.BlockCreate(rootId, '', I.BlockPosition.Bottom, { type: I.BlockType.Text, style: I.TextStyle.Paragraph }, (message: any) => { 
				this.onBlock(message.blockId); 
			});
		} else {
			this.onBlock(first.id);
		};
	};

});

export default BlockType;