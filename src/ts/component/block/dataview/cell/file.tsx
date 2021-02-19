import * as React from 'react';
import { InputWithFile, IconObject } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props extends I.Cell {};

@observer
class CellFile extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block, readOnly, index, getRecord, canEdit } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};
		
		let value = this.getValue();

		value = value.map((it: string) => { return blockStore.getDetails(rootId, it); });
		value = value.filter((it: any) => { return !it._detailsEmpty_; });

		if (!value.length) {
			return !canEdit ? null : (
				<InputWithFile 
					block={block} 
					icon="file" 
					textFile="Upload a file" 
					onChangeUrl={this.onChangeUrl} 
					onChangeFile={this.onChangeFile} 
					readOnly={readOnly} 
					canResize={false}
				/>
			);
		};

		const File = (item: any) => (
			<div className="element file" onClick={(e: any) => { DataUtil.objectOpen(e, item); }}>
				<div className="flex">
					<IconObject object={item} />
					<div className="name">{item.name}</div>
				</div>
			</div>
		);

		const Image = (item: any) => (
			<div className="element image" onClick={(e: any) => { DataUtil.objectOpen(e, item); }}>
				<IconObject object={item} />
			</div>
		);

		return (
			<React.Fragment>
				{value.map((item: any, i: number) => {
					const type = DataUtil.schemaField(item.type);
					switch (type) {
						case 'file':
							return <File key={i} {...item} />;

						case 'image':
							return <Image key={i} {...item} />;
					};
				})}
			</React.Fragment>
		);
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
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
		const { onChange } = this.props;
		
		let value = this.getValue();
		value.push(hash);
		value = Util.arrayUnique(value);

		onChange(value);
	};

};

export default CellFile;