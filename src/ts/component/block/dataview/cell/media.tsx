import * as React from 'react';
import { InputWithFile, Icon } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';

interface Props extends I.Cell {};

@observer
class CellMedia extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { relation, rootId, block, index, readOnly, data, onOpen } = this.props;
		
		let value = (data[index] || {})[relation.key] || [];
		if (!value.length) {
			return <InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} readOnly={readOnly} />;
		};

		value = value.map((it: string) => {
			return blockStore.getDetails(rootId, it);
		});

		const File = (item: any) => (
			<div className="item file" onClick={(e: any) => { this.onOpen(e, item, item.type); }}>
				<Icon className={[ 'file-type', Util.fileIcon(data) ].join(' ')} />
				{item.name}
			</div>
		);

		const Image = (item: any) => (
			<div className="item image" onClick={(e: any) => { this.onOpen(e, item, item.type); }}>
				<img src={commonStore.imageUrl(item.id, 20)} className="preview" />
			</div>
		);

		return (
			<React.Fragment>
				{value.map((item: any, i: number) => {
					const type = DataUtil.schemaField(item.type && item.type.length ? item.type[0] : '');
					switch (type) {
						case 'file':
							return <File key={i} {...item} type={type} />;

						case 'image':
							return <Image key={i} {...item} type={type} />;
					};
				})}
			</React.Fragment>
		);
	};

	onOpen (e: any, item: any, type: string) {	
		e.preventDefault();
		e.stopPropagation();

		const { onOpen } = this.props;
		onOpen(e, item, item.type);
	};

	onChangeUrl (e: any, url: string) {
		C.UploadFile(url, '', I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
				this.save(message.hash);
			};
		});
	};
	
	onChangeFile (e: any, path: string) {
		C.UploadFile('', path, I.FileType.None, false, (message: any) => {
			if (!message.error.code) {
				this.save(message.hash);
			};
		});
	};

	save (hash: string) {
		const { relation, index, onChange } = this.props;
		const data = this.props.data[index][relation.key] || [];

		data.push(hash);
		onChange(data);
	};
	
};

export default CellMedia;