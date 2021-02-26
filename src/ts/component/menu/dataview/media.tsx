import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, InputWithFile } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';
import arrayMove from 'array-move';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuDataviewMedia extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.onSortEnd = this.onSortEnd.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { param, position } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		let value = Util.objectCopy(data.value || []);
		value = value.map((it: string) => { return blockStore.getDetails(rootId, it); });
		value = value.filter((it: any) => { return !it._objectEmpty_; });

        const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const File = (item: any) => (
			<div className="element file" onClick={(e: any) => { DataUtil.objectOpen(item); }}>
				<Icon className={[ 'iconFile', Util.fileIcon(item) ].join(' ')} />
				<div className="name">{item.name}</div>
			</div>
		);

		const Image = (item: any) => (
			<div className="element image" onClick={(e: any) => { DataUtil.objectOpen(item); }}>
				<img src={commonStore.imageUrl(item.id, 208)} className="preview" onLoad={() => { position(); }} />
			</div>
		);

        const Item = SortableElement((item: any) => {
			let content = null;
			switch (item.layout) {
				case I.ObjectLayout.File:
					content = <File {...item} />;
					break;

				case I.ObjectLayout.Image:
					content = <Image {...item} />;
					break;
			};
			return (
				<div className="item">
					<Handle />
					{content}
				</div>
			);
		});

        const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{value.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
					))}
					<div className="item add">
						<InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} canResize={false} />
					</div>
				</div>
			);
		});

		return (
			<div className="items">
                <List 
                    axis="y" 
                    lockAxis="y"
                    lockToContainerEdges={true}
                    transitionDuration={150}
                    distance={10}
                    onSortEnd={this.onSortEnd}
                    useDragHandle={true}
                    helperClass="isDragging"
                    helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
                />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
    };
    
    onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		
		let value = Util.objectCopy(data.value || []);
		value = arrayMove(value, oldIndex, newIndex);

		this.save(value);
    };

	onChangeUrl (e: any, url: string) {
		C.UploadFile(url, '', I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
				this.add(message.hash);
			};
		});
	};
	
	onChangeFile (e: any, path: string) {
		C.UploadFile('', path, I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
				this.add(message.hash);
			};
		});
	};

	add (hash: string) {
		const { param } = this.props;
		const { data } = param;

		let value = Util.objectCopy(data.value || []);
		value.push(hash);
		value = Util.arrayUnique(value);

		this.save(value);
	};	

	save (value: string[]) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == id; });

		onChange(value);

		if (menu) {
			menu.param.data.value = value;
			commonStore.menuUpdate(id, menu.param);
		};
	};

};

export default MenuDataviewMedia;