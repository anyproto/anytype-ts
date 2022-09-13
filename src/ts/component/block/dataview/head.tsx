import * as React from 'react';
import { Icon } from 'Component';
import { I, C } from 'Lib';
import { menuStore } from 'Store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

interface Props extends I.ViewComponent {
};

const Constant = require('json/constant.json');

const Head = observer(class Head extends React.Component<Props, {}> {

	menuContext: any = null;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onSource = this.onSource.bind(this);
		this.onView = this.onView.bind(this);
	};

	render () {
		const { rootId, block, readonly, getView } = this.props;
		const sources = block.content.sources || [];
		const length = sources.length;
		const view = getView();

		let icon = null;
		let onClick = null;

		if (!readonly) {
			if (!length) {
				onClick = this.onSelect;
				icon = <Icon className="plus" />;
			} else {
				onClick = this.onSource;
				icon = (
					<React.Fragment>
						<Icon className="set" />
						{length}
					</React.Fragment>
				);
			};

			icon = <div id="head-source-select" className="iconWrap" onClick={onClick}>{icon}</div>;
		};

		return (
			<div className="dataviewHead">
				<div className="title">
					<div 
						className="value" 
						contentEditable="true" 
						suppressContentEditableWarning={true}
					>
					</div>
					<div className="placeholder">New set</div>
				</div>

				{icon}
				
				<div id="head-view-select" className="select" onClick={this.onView}>
					<div className="name">{view.name}</div>
					<Icon className="arrow dark" />
				</div>
			</div>
		);
	};

	onView (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();

		menuStore.open('dataviewViewList', { 
			element: `#block-${block.id} #head-view-select`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: observable.box(view),
			},
		});
	};

	onSelect () {
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

		let menuId = '';
		let menuParam = {
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId: rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'new':
				menuId = 'dataviewSource';
				break;

			case 'existing':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: Constant.relationKey.type, condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					],
					keys: Constant.defaultRelationKeys.concat([ 'setOf' ]),
					onSelect: (item: any) => {
						C.BlockDataviewSetSource(rootId, block.id, item.setOf);
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			if (menuStore.isOpen(menuId)) {
				menuStore.open(menuId, param);
			} else {
				menuStore.closeAll(Constant.menuIds.dataviewHead, () => {
					menuStore.open(menuId, menuParam);
				});
			};
		};
	};

	onSource (e: any) {
		const { rootId, block, readonly } = this.props;

		if (readonly) {
			return;
		};

		menuStore.closeAll(null, () => { 
			menuStore.open('dataviewSource', {
				element: `#block-${block.id} #head-source-select`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				data: {
					rootId: rootId,
					blockId: block.id,
				}
			}); 
		});
	};

});

export default Head;