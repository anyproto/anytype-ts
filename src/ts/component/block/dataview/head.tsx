import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Editable } from 'Component';
import { I, C, keyboard, UtilObject, analytics, translate, UtilCommon } from 'Lib';
import { menuStore, detailStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

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
	ref = null;
	range: I.TextRange = null;

	constructor (props: I.ViewComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
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
		const placeholder = isCollection ? translate('defaultNameCollection') : translate('defaultNameSet');

		if (className) {
			cn.push(className);
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		let icon = null;
		if (targetObjectId && !isCollection) {
			icon = <Icon id="head-source-select" className="source" onClick={this.onSource} />;
		} else {
			icon = <div id="head-source-select" />;
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
					placeholder={placeholder}
					onFocus={this.onFocus}
					onMouseDown={this.onTitle}
					onBlur={this.onBlur}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onSelect={this.onSelect}
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
			window.setTimeout(() => { 
				const l = this.getValue().length;
				this.setRange(this.range || { from: l, to: l });
			}, 15);
		};
	};

	componentWillUnmount () {
		this.save();
		this._isMounted = false;
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

		if (object.isDeleted) {
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

		const addParam: any = {};
		const menuParam: any = {
			menuKey: item.id,
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {},
		};
		const onCreate = (message: any, isNew: boolean) => {
			if (message.views && message.views.length) {
				window.setTimeout(() => loadData(message.views[0].id, 0, true), 50);
			};

			if (isNew) {
				this.menuContext?.close();
				this.setEditing(true);
			};

			analytics.event('InlineSetSetSource', { type: isNew ? 'newObject' : 'externalObject' });
		};

		let filters: I.Filter[] = [];
		let menuId = '';

		if (isCollection) {
			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
			]);

			addParam.name = translate('blockDataviewCreateNewCollection');
			addParam.onClick = (details: any) => {
				C.ObjectCreate({ ...details, layout: I.ObjectLayout.Collection }, [], '', Constant.typeKey.collection, commonStore.space, (message: any) => { 
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => onCreate(message, true));
				});
			};
		} else {
			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set },
				{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
			]);

			addParam.name = translate('blockDataviewCreateNewSet');
			addParam.onClick = (details: any) => {
				C.ObjectCreateSet([], details, '', commonStore.space, (message: any) => {
					C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => {
						$(this.node).find('#head-source-select').trigger('click');
						onCreate(message, true);
					});
				});
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
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => onCreate(message, false));
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

		switch (item.id) {
			case 'editTitle': {
				this.setEditing(true);
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

		this.save();
		window.setTimeout(() => this.setEditing(false), 40);
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { 
			e.preventDefault();
			this.save(); 
		});
	};

	onKeyUp () {
		this.checkInput(!this.getValue());
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
		if ([ 
			translate('defaultNamePage'), 
			translate('defaultNameSet'), 
			translate('defaultNameCollection'),
		].includes(name)) {
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

		if (!targetObjectId) {
			return;
		};
		
		let value = this.getValue();
		if (value == object.name) {
			return;
		};

		if ([ 
			translate('defaultNamePage'), 
			translate('defaultNameSet'), 
			translate('defaultNameCollection'),
		].includes(value)) {
			value = '';
		};

		if (targetObjectId) {
			UtilObject.setName(targetObjectId, value);
		};
		
		this.ref?.placeholderCheck();
	};

	onIconSelect (icon: string) {
		UtilObject.setIcon(this.props.block.content.targetObjectId, icon, '');
	};

	onIconUpload (objectId: string) {
		UtilObject.setIcon(this.props.block.content.targetObjectId, '', objectId);
	};

	onFullscreen () {
		const { rootId, block } = this.props;

		UtilObject.openPopup({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId: block.id } });
		analytics.event('InlineSetOpenFullscreen');
	};

	setRange (range: I.TextRange) {
		this.ref?.setRange(range);
	};

	setEditing (v: boolean) {
		this.setState({ isEditing: v });
	};

});

export default Head;