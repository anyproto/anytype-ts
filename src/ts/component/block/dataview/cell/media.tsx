import * as React from 'react';
import { InputWithFile } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props extends I.Cell {};

@observer
class CellMedia extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { relation, rootId, block, index, readOnly, data } = this.props;
		const value = (data[index] || {})[relation.key] || [];

		if (!value.length) {
			return <InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} readOnly={readOnly} />;
		};

		for (let id of value) {
			const details = blockStore.getDetails(rootId, id);
			console.log(details);
		};

		return (
			<React.Fragment>
				{value.join('<br/>')}
			</React.Fragment>
		);
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