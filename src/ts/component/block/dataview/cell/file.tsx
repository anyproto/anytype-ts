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
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, block, readOnly, index, getRecord, canEdit, iconSize } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		let value = this.getValue();
		value = value.map((it: string) => { return blockStore.getDetails(rootId, it); });
		value = value.filter((it: any) => { return !it._objectEmpty_; });

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

		const Item = (item: any) => {
			return(
				<div className="element" onClick={(e: any) => { this.onClick(e, item); }}>
					<div className="flex">
						<IconObject object={item} size={iconSize} />
						<div className="name">{item.name}</div>
					</div>
				</div>
			);
		};

		return (
			<div className="wrap">
				{value.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
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

	onClick (e: any, item: any) {
		const { canEdit } = this.props;

		if (!canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
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