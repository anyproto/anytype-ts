import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Icon, IconObject, Editable } from 'Component';
import { I, C, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {};

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
		this.onSourceSelect = this.onSourceSelect.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onIconUpload = this.onIconUpload.bind(this);
		this.onFullscreen = this.onFullscreen.bind(this);
		this.onTitle = this.onTitle.bind(this);
		this.onTitleOptionClick = this.onTitleOptionClick.bind(this);
	};

	render () {
		const { rootId, block, readonly, getSources, className } = this.props;
		const { isEditing } = this.state;
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId);
		const sources = getSources();
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
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

					<div id="head-source-select" className="iconWrap" onClick={this.onSourceSelect}>
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

	onSourceSelect () {
		const { block } = this.props;
		const options: any[] = [
			{ id: 'new', name: 'Create new source', arrow: true },
			{ id: 'existing', name: 'Link to source of another set', arrow: true }
		];
		
		menuStore.open('select', { 
			element: `#block-${block.id} #head-source-select`,
			width: 256,
			horizontal: I.MenuDirection.Center,
			subIds: Constant.menuIds.dataviewHead,
			onOpen: (context: any) => {
				this.menuContext = context;
			},
			data: {
				options: options,
				onOver: this.onOver,
			},
		});
	};

	onOver (e: any, item: any) {
		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;

		let menuId = '';
		let menuParam = {
			menuKey: item.id,
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId,
				blockId: 'dataview',
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'new':
				menuId = 'dataviewSource';
				menuParam.data = Object.assign(menuParam.data, {
					objectId: targetObjectId,
				});
				break;

			case 'existing':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					],
					keys: Constant.defaultRelationKeys.concat([ 'setOf' ]),
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id);

						this.menuContext.close();
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.dataviewHead, () => {
				menuStore.open(menuId, menuParam);
			});
		};
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
		];

		if (targetObjectId) {
			options.unshift({ id: 'openSource', icon: 'expand', name: 'Open data source' });
		};

		menuStore.open('select', {
			element: `#block-${block.id} #head-title-wrapper`,
			horizontal: I.MenuDirection.Left,
			subIds: Constant.menuIds.dataviewHead,
			onOpen: (context: any) => {
				this.menuContext = context;
			},
			data: {
				options: options,
				onSelect: this.onTitleOptionClick,
			},
		});
	};

	onTitleOptionClick (e: any, item: any) {
		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId);

		switch (item.id) {
			case 'editTitle':
				this.setState({ isEditing: true }, () => {
					const length = this.getValue().length;
					this.ref.setRange({ from: length, to: length });
				});
				break;

			case 'openSource':
				ObjectUtil.openAuto(object);
				break;

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
	};

});

export default Head;