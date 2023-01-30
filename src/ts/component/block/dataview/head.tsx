import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Editable } from 'Component';
import { I, C, keyboard, DataUtil, ObjectUtil, analytics } from 'Lib';
import { menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	onSourceSelect?(element: any, param: Partial<I.MenuParam>): void;
	onSourceTypeSelect?(element: any): void;
};

interface State {
	isEditing: boolean;
};

const Head = observer(class Head extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};
	_isMounted = false;
	node: any = null;
	menuContext: any = null;
	timeout = 0;
	ref: any = null;
	range: I.TextRange = null;

	constructor (props: Props) {
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
		const { rootId, block, readonly, getSources, className, isInline } = this.props;
		const { isEditing } = this.state;
		const { targetObjectId } = block.content;
		const targetId = isInline ? targetObjectId : rootId;
		const object = detailStore.get(rootId, targetId);
		const sources = getSources();
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
			>
				<div id="head-title-wrapper" className="side left">
					<IconObject
						id={`icon-set-${block.id}`}
						object={object} size={20}
						iconSize={20}
						canEdit={!readonly}
						onSelect={this.onIconSelect}
						onUpload={this.onIconUpload}
					/>

					<Editable
						ref={(ref: any) => { this.ref = ref; }}
						id="value"
						readonly={readonly || !isEditing}
						placeholder={DataUtil.defaultName('set')}
						onFocus={this.onFocus}
						onMouseDown={this.onTitle}
						onBlur={this.onBlur}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						onSelect={this.onSelect}
						onCompositionStart={this.onCompositionStart}
					/>

					{targetObjectId ? (
						<div id="head-source-select" className="iconWrap" onClick={this.onSource}>
							<Icon className="set" />
						</div>
 					) : ''}

				</div>
				<div className="side right">
					<div className="iconWrap dn" onClick={this.onFullscreen}>
						<Icon className="expand" tooltip="Open fullscreen" />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.setValue();
	};

	componentDidUpdate () {
		this.setValue();

		if (!this.state.isEditing) {
			this.ref.setRange({ from: 0, to: 0 });
		} else 
		if (this.ref) {
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
		const { rootId, block, onSourceSelect, isInline } = this.props;
		const { targetObjectId } = block.content;
		const { isEditing } = this.state;
		const element = `#block-${block.id} #head-title-wrapper`;
		const targetId = isInline ? targetObjectId : rootId;
		const object = detailStore.get(rootId, targetId);

		if (isEditing) {
			return;
		};

		if (!targetObjectId) {
			onSourceSelect(element, { horizontal: I.MenuDirection.Left });
			return;
		};

		let options: any[] = [
			{ id: 'editTitle', icon: 'editText', name: 'Edit title' },
			{ id: 'sourceChange', icon: 'source', name: 'Change source set', arrow: true },
			{ id: 'sourceOpen', icon: 'expand', name: 'Open source set' },
		];

		if (object.isDeleted) {
			options = options.filter(it => it.id == 'sourceChange');
		};

		menuStore.open('select', {
			element,
			offsetY: 4,
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
		const { rootId, block, getData } = this.props;
		const { targetObjectId } = block.content;

		if (!item.arrow) {
			menuStore.closeAll([ 'searchObject' ]);
			return;
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

		switch (item.id) {
			case 'sourceChange':
				menuId = 'searchObject';
				menuParam.className = 'single';
				menuParam.data = Object.assign(menuParam.data, {
					rootId,
					blockId: block.id,
					blockIds: [ block.id ],
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					],
					canAdd: true,
					rebind: this.menuContext.ref.rebind,
					value: [ targetObjectId ],
					addParam: { 
						name: 'Create new set',
						onClick: () => {
							C.ObjectCreateSet([], {}, '', (message: any) => {
								C.BlockDataviewCreateFromExistingObject(rootId, block.id, message.objectId, (message: any) => {
									$(this.node).find('#head-source-select').trigger('click');

									if (message.views && message.views.length) {
										getData(message.views[0].id, 0, true);
									};
								});

								analytics.event('InlineSetSetSource', { type: 'newObject' });
							});
						},
					},
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => {
							if (message.views && message.views.length) {
								getData(message.views[0].id, 0, true);
							};
						});

						analytics.event('InlineSetSetSource');
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

		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId);
		const length = this.getValue().length;

		switch (item.id) {
			case 'editTitle': {
				this.setState({ isEditing: true }, () => {
					this.ref.setRange({ from: length, to: length });
				});
				break;
			};

			case 'sourceOpen': {
				ObjectUtil.openAuto(object);
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
		this.ref.setRange({ from: 0, to: 0 });
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
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelect () {
		if (this.ref) {
			this.range = this.ref.getRange();
		};
	};

	setValue () {
		if (!this._isMounted) {
			return;
		};

		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;
		const object = targetObjectId ? detailStore.get(rootId, targetObjectId) : {};

		if (!this.ref) {
			return;
		};

		let name = String(object.name || '');
		if ((name == DataUtil.defaultName('page')) || (name == DataUtil.defaultName('set'))) {
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
		const { block } = this.props;
		const { targetObjectId } = block.content;
		
		let value = this.getValue();

		if ((value == DataUtil.defaultName('page')) || (value == DataUtil.defaultName('set'))) {
			value = '';
		};

		if (targetObjectId) {
			ObjectUtil.setName(targetObjectId, this.getValue());
		};
		
		if (this.ref) {
			this.ref.placeholderHide();
		};
	};

	onIconSelect (icon: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (targetObjectId) {
			ObjectUtil.setIcon(targetObjectId, icon, '');
		};
	};

	onIconUpload (hash: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (targetObjectId) {
			ObjectUtil.setIcon(targetObjectId, '', hash);
		};
	};

	onFullscreen () {
		const { rootId, block } = this.props;

		ObjectUtil.openPopup({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId: block.id } });
		analytics.event('InlineSetOpenFullscreen');
	};

});

export default Head;