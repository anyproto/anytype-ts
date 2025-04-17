import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, ObjectName } from 'Component';
import { I, C, S, U, J, Onboarding, focus, keyboard, analytics, history as historyPopup, translate } from 'Lib';

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
		const { block, readonly } = this.props;

		if (readonly) {
			return null;
		};

		const items = this.getItems();
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		const Item = (item: any) => {
			return (
				<div 
					id={'item-' + item.id} 
					className="item" 
					onClick={e => this.onClick(e, item)} 
					onMouseEnter={e => this.onOver(e, item)} 
					onMouseLeave={this.onOut}
				>
					{item.icon ? <Icon className={item.icon} /> : ''}
					<ObjectName object={item} />
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
		const object = S.Detail.get(rootId, rootId, []);
		const items = U.Data.getObjectTypesForNewObject({ withCollection: true, withSet: true, limit: 5 }).filter(it => it.id != object.type);

		items.push({ id: 'menu', icon: 'search', name: translate('commonMyTypes') });

		return items;
	};

	onKeyDown (e: any) {
		if (S.Menu.isOpen() || S.Popup.isOpenKeyboard()) {
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

		this.isFocused = !!item;
	};

	onMenu (e: any) {
		const { block } = this.props;
		const element = `#block-${block.id} #item-menu`;
		const obj = $(element);

		S.Menu.open('typeSuggest', {
			element: `#block-${block.id} #item-menu`,
			onOpen: () => obj.addClass('active'),
			onClose: () => { 
				obj.removeClass('active'); 
				focus.apply();
			},
			data: {
				filter: '',
				filters: [
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getLayoutsForTypeSelection() },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] }
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

		if (U.Object.isInSetLayouts(item.recommendedLayout)) {
			this.onObjectTo(item.recommendedLayout);
		} else {
			this.onChange(item.id);
		};
	};

	onObjectTo (layout: I.ObjectLayout) {
		const { rootId, isPopup } = this.props;

		let typeId = '';

		const cb = () => {
			if (isPopup) {
				historyPopup.clear();
			};

			keyboard.disableClose(true);
			U.Object.openAuto({ id: rootId, layout }, { replace: true });
			keyboard.disableClose(false);

			analytics.event('SelectObjectType', { objectType: typeId, layout });
		};

		switch (layout) {
			case I.ObjectLayout.Set: {
				typeId = S.Record.getSetType()?.id;
				C.ObjectToSet(rootId, [], cb);
				break;
			};

			case I.ObjectLayout.Collection: {
				typeId = S.Record.getCollectionType()?.id;
				C.ObjectToCollection(rootId, cb);
				break;
			};
		};
	};

	onChange (typeId: any) {
		const { rootId, isPopup } = this.props;
		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return;
		};

		C.ObjectSetObjectType(rootId, type.uniqueKey, () => {
			C.ObjectApplyTemplate(rootId, type.defaultTemplateId, this.onTemplate);
		});

		Onboarding.start('objectCreationFinish', isPopup);
		analytics.event('SelectObjectType', { objectType: typeId });
	};

	onBlock () {
		const { rootId, isPopup } = this.props;
		const block = S.Block.getFirstBlock(rootId, 1, it => it.isText());

		if (block) {
			const l = block.getLength();
			
			focus.set(block.id, { from: l, to: l });
			focus.apply();
		};

		U.Common.triggerResizeEditor(isPopup);
	};

	onTemplate () {
		const { rootId } = this.props;
		const first = S.Block.getFirstBlock(rootId, 1, it => it.isText());

		if (!first) {
			C.BlockCreate(rootId, '', I.BlockPosition.Bottom, { type: I.BlockType.Text, style: I.TextStyle.Paragraph }, () => this.onBlock());
		} else {
			this.onBlock();
		};
	};

});

export default BlockType;
