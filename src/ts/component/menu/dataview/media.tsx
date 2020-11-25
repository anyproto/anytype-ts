import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, InputWithFile } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuDataviewMedia extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		let value = Util.objectCopy(data.value || []);
		value = value.map((it: string) => { return blockStore.getDetails(rootId, it); });
		value = value.filter((it: any) => { return !it._detailsEmpty_; });

        const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const File = (item: any) => (
			<div className="element file">
				<Icon className={[ 'file-type', Util.fileIcon(data) ].join(' ')} />
				<div className="name">{item.name}</div>
			</div>
		);

		const Image = (item: any) => (
			<div className="element image">
				<img src={commonStore.imageUrl(item.id, 208)} className="preview" />
			</div>
		);

        const Item = SortableElement((item: any) => {
			const type = DataUtil.schemaField(item.type && item.type.length ? item.type[0] : '');

			let content = null;
			switch (type) {
				case 'file':
					content = <File {...item} />;
					break;

				case 'image':
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
						<InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
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

    };

	onChangeUrl (e: any, url: string) {
		C.UploadFile(url, '', I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
			};
		});
	};
	
	onChangeFile (e: any, path: string) {
		C.UploadFile('', path, I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
			};
		});
	};

};

export default MenuDataviewMedia;