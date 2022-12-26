import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, Editable } from 'Component';
import { I, C, keyboard, DataUtil, ObjectUtil, analytics } from 'Lib';
import { menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	onSourceSelect?(e: any): void;
};

interface State {
	isEditing: boolean;
};

const Head = observer(class Head extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};
	_isMounted: boolean = false;
	menuContext: any = null;
	timeout: number = 0;
	ref: any = null;
	range: I.TextRange = null;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
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
	};

	render () {
		const { rootId, block, readonly, getSources, className, onSourceSelect } = this.props;
		const { isEditing } = this.state;
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId);
		const sources = getSources();
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		return (
			<div className={cn.join(' ')}>
				<div id="head-title-wrapper" className="side left">
					<IconObject id={`icon-set-${block.id}`} object={object} size={18} canEdit={!readonly} onSelect={this.onIconSelect} onUpload={this.onIconUpload} />

					<Editable 
						ref={(ref: any) => { this.ref = ref; }}
						id="value"
						readonly={readonly || !isEditing}
						placeholder={DataUtil.defaultName('set')}
						onFocus={this.onFocus}
						onMouseDown={this.onTitle}
						onBlur={this.onBlur}
						onKeyUp={this.onKeyUp}
						onSelect={this.onSelect}
						onCompositionStart={this.onCompositionStart}
					/>

					<div id="head-source-select" className="iconWrap" onClick={onSourceSelect}>
						<Icon className="set" />
						{sources.length}
					</div>
				</div>
				<div className="side right">
					<div className="iconWrap" onClick={this.onFullscreen}>
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

		if (this.ref && this.range) {
			this.ref.setRange(this.range);
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onTitle (e: any) {
		const { block } = this.props;
		const { targetObjectId } = block.content;
		const { isEditing } = this.state;

		if (isEditing) {
			return;
		};

		const options: any[] = [
			{ id: 'editTitle', icon: 'editText', name: 'Edit title' },
			{ id: 'changeSource', icon: 'folderBlank', name: 'Change source', arrow: true },
		];

		if (targetObjectId) {
			options.unshift({ id: 'openSource', icon: 'expand', name: 'Open data source' });
		};

		menuStore.open('select', {
			element: `#block-${block.id} #head-title-wrapper`,
			horizontal: I.MenuDirection.Left,
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
			data: {},
		};

		switch (item.id) {
			case 'changeSource':
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

			case 'openSource': {
				ObjectUtil.openAuto(object);
				analytics.event('InlineSetOpenSource');
				break;
			};

		};
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		keyboard.setFocus(false);
		this.setState({ isEditing: false });
	};

	onCompositionStart (e: any) {
		window.clearTimeout(this.timeout);
	};

	onKeyUp (e: any) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelect (e: any) {
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

		if (!targetObjectId) {
			return;
		};

		const object = detailStore.get(rootId, targetObjectId);
		const { name } = object;

		if (!name || (name == DataUtil.defaultName('page')) || (name == DataUtil.defaultName('set'))) {
			return;
		};

		if (this.ref) {
			this.ref.setValue(object.name);
			this.ref.placeholderCheck();
		};
	};

	getValue () {
		return this.ref ? this.ref.getTextValue() : '';
	};

	save () {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (targetObjectId) {
			DataUtil.blockSetText(targetObjectId, 'title', this.getValue(), [], true);
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