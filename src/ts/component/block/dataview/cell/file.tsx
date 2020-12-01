import * as React from 'react';
import { InputWithFile, Icon } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellFile extends React.Component<Props, State> {

	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { relation, rootId, block, readOnly, viewType, index, getRecord } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};
		
		let canEdit = !relation.isReadOnly && (viewType == I.ViewType.Grid);
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
			<div className="item file" onClick={(e: any) => { this.onOpen(e, item, item.type); }}>
				<Icon className={[ 'file-type', Util.fileIcon(item) ].join(' ')} />
				<div className="name">{item.name}</div>
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

	componentDidUpdate () {
		const { editing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);
		const body = $('body');

		if (editing) {
			cell.addClass('isEditing');
			body.addClass('over');
		} else {
			cell.removeClass('isEditing');
			body.removeClass('over');
		};
	};

	setEditing (v: boolean) {
		const { viewType, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (viewType == I.ViewType.Grid);

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.key];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
	};

	onOpen (e: any, item: any, type: string) {	
		e.preventDefault();
		e.stopPropagation();

		const { onOpen } = this.props;
		onOpen(e, item, item.type);
	};

	onChangeUrl (e: any, url: string) {
		C.UploadFile(url, '', I.FileType.None, false, (message: any) => {
			this.setEditing(false);
			if (!message.error.code) {
				this.save(message.hash);
			};
		});
	};
	
	onChangeFile (e: any, path: string) {
		C.UploadFile('', path, I.FileType.None, false, (message: any) => {
			this.setEditing(false);
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