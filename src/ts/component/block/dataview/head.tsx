import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Editable } from 'Component';
import { I, C, keyboard, UtilObject, analytics, translate, UtilCommon } from 'Lib';
import { menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	isEditing: boolean;
};

const Head = observer(class Head extends React.Component<I.ViewComponent, State> {

	state = {
		isEditing: false,
	};
	_isMounted = false;
	node: any = null;
	menuContext: any = null;
	timeout = 0;
	ref = null;
	range: I.TextRange = null;

	constructor (props: I.ViewComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onIconUpload = this.onIconUpload.bind(this);
		this.onFullscreen = this.onFullscreen.bind(this);
		this.onTitle = this.onTitle.bind(this);
		this.onTitleOver = this.onTitleOver.bind(this);
		this.onTitleSelect = this.onTitleSelect.bind(this);
		this.onSource = this.onSource.bind(this);
	};

	render () {
		const { block, readonly, className, isCollection, getTarget } = this.props;
		const { isEditing } = this.state;
		const { targetObjectId } = block.content;
		const object = getTarget();
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		let icon = <div id="head-source-select" />;
		if (targetObjectId && !isCollection) {
			icon = <Icon id="head-source-select" className="source" onClick={this.onSource} />;
		};

		return (
			<div 
				id={`block-head-${block.id}`}
				ref={node => this.node = node}
				className={cn.join(' ')}
			>
				<Editable
					ref={ref => this.ref = ref}
					id="value"
					readonly={readonly || !isEditing}
					placeholder={UtilObject.defaultName(isCollection ? 'Collection' : 'Set')}
					onFocus={this.onFocus}
					onMouseDown={this.onTitle}
					onBlur={this.onBlur}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onSelect={this.onSelect}
					onCompositionStart={this.onCompositionStart}
				/>
				{icon}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.setValue();
	};

	componentDidUpdate () {
		this.setValue();

		if (this.state.isEditing && this.ref) {
			const l = this.getValue().length;
			this.ref.setRange(this.range || { from: l, to: l });
		};
	};

	componentWillUnmount () {
		this.save();
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onTitle () {
		const { rootId, block, onSourceSelect, isCollection } = this.props;
		const { targetObjectId } = block.content;
		const { isEditing } = this.state;
		const element = `#block-head-${block.id}`;
		const object = detailStore.get(rootId, targetObjectId);
		const sourceName = isCollection ? 'collection' : 'set';

		if (isEditing) {
			return;
		};

		if (!targetObjectId) {
			onSourceSelect(element, { horizontal: I.MenuDirection.Left });
			return;
		};

		let options: any[] = [
			{ id: 'editTitle', icon: 'editText', name: translate('blockDataviewHeadMenuEdit') },
			{ id: 'sourceChange', icon: 'source', name: UtilCommon.sprintf(translate('blockDataviewHeadMenuChange'), sourceName), arrow: true },
			{ id: 'sourceOpen', icon: 'expand', name: UtilCommon.sprintf(translate('blockDataviewHeadMenuOpen'), sourceName) },
		];

		if (object.isArchived || object.isDeleted) {
			options = options.filter(it => it.id == 'sourceChange');
		};

		menuStore.open('select', {
			element,
			offsetY: 4,
			width: 240,
			onOpen: (context: any) => {
				this.menuContext = context;
			},
			data: {
				options,
				onOver: this.onTitleOver,
				onSelect: this.onTitleSelect,
			},
		});
	};

	onTitleOver (e: any, item: any) {
		const { rootId, block, loadData, isCollection } = this.props;
		const { targetObjectId } = block.content;

		if (!item.arrow) {
			menuStore.closeAll([ 'searchObject' ]);
			return;
		};

		let filters: I.Filter[] = [];
		let addParam: any = {};

		if (isCollection) {
			addParam.name = translate('blockDataviewCreateNewCollection');
			addParam.onClick = () => {
				C.ObjectCreate({ layout: I.ObjectLayout.Collection, type: Constant.typeId.collection }, [], '', (message: any) => { 
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, onCreate);
					analytics.event('InlineSetSetSource', { type: 'newObject' });
				});
			};

			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.collection },
			]);
		} else {
			addParam.name = translate('blockDataviewCreateNewSet');
			addParam.onClick = () => {
				C.ObjectCreateSet([], {}, '', (message: any) => {
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => {
						$(this.node).find('#head-source-select').trigger('click');
						onCreate(message);
					});

					analytics.event('InlineSetSetSource', { type: 'newObject' });
				});
			};

			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
				{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
			]);
		};

		let menuId = '';
		let menuParam: any = {
			menuKey: item.id,
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {},
		};

		const onCreate = (message: any) => {
			if (message.views && message.views.length) {
				window.setTimeout(() => { loadData(message.views[0].id, 0, true); }, 50);
			};
		};

		switch (item.id) {
			case 'sourceChange':
				menuId = 'searchObject';
				menuParam.className = 'single';
				menuParam.data = Object.assign(menuParam.data, {
					rootId,
					blockId: block.id,
					blockIds: [ block.id ],
					filters,
					canAdd: true,
					rebind: this.menuContext.ref.rebind,
					value: [ targetObjectId ],
					addParam,
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, onCreate);
						analytics.event('InlineSetSetSource', { type: 'externalObject' });
						this.menuContext.close();
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll([ 'searchObject' ], () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onTitleSelect (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { getTarget } = this.props;
		const object = getTarget();
		const length = this.getValue().length;

		switch (item.id) {
			case 'editTitle': {
				this.setState({ isEditing: true }, () => {
					this.ref.setRange({ from: length, to: length });
				});
				break;
			};

			case 'sourceOpen': {
				UtilObject.openAuto(object);
				analytics.event('InlineSetOpenSource');
				break;
			};

		};
	};

	onSource () {
		const { block, onSourceTypeSelect } = this.props;

		onSourceTypeSelect(`#block-${block.id} #head-source-select`);
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);

		this.save();
		window.setTimeout(() => { this.setState({ isEditing: false }); }, 40);
	};

	onCompositionStart () {
		window.clearTimeout(this.timeout);
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { 
			e.preventDefault();
			this.save(); 
		});
	};

	onKeyUp () {
		this.checkInput(!this.getValue());

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.save(), 1000);
	};

	onSelect () {
		if (this.ref) {
			this.range = this.ref.getRange();
		};
	};

	setValue () {
		if (!this._isMounted || !this.ref) {
			return;
		};

		const { getTarget } = this.props;
		const object = getTarget();

		let name = String(object.name || '');
		if ((name == UtilObject.defaultName('Page')) || (name == UtilObject.defaultName('Set'))) {
			name = '';
		};

		this.ref.setValue(name);
		this.ref.placeholderCheck();
		this.checkInput(!name);
	};

	getValue () {
		return this.ref ? this.ref.getTextValue() : '';
	};

	checkInput (isEmpty: boolean) {
		if (!this.ref) {
			return;
		};

		const node = $(this.ref.node);
		isEmpty ? node.addClass('isEmpty') : node.removeClass('isEmpty');
	};

	save () {
		const { block, getTarget } = this.props;
		const { targetObjectId } = block.content;
		const object = getTarget();
		
		let value = this.getValue();

		if (value == object.name) {
			return;
		};

		if ((value == UtilObject.defaultName('Page')) || (value == UtilObject.defaultName('Set'))) {
			value = '';
		};

		if (targetObjectId) {
			UtilObject.setName(targetObjectId, this.getValue());
		};
		
		if (this.ref) {
			this.ref.placeholderHide();
		};
	};

	onIconSelect (icon: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (targetObjectId) {
			UtilObject.setIcon(targetObjectId, icon, '');
		};
	};

	onIconUpload (hash: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (targetObjectId) {
			UtilObject.setIcon(targetObjectId, '', hash);
		};
	};

	onFullscreen () {
		const { rootId, block } = this.props;

		UtilObject.openPopup({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId: block.id } });
		analytics.event('InlineSetOpenFullscreen');
	};

});

export default Head;