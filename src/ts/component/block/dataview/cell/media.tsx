import * as React from 'react';
import { InputWithFile } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellMedia extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { relation, block, index, readOnly } = this.props;
		const data = this.props.data[index][relation.key] || [];

		if (!data.length) {
			return <InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} readOnly={readOnly} />;
		};
		
		return (
			<React.Fragment>
				{data.join('<br/>')}
			</React.Fragment>
		);
	};

	onChangeUrl (e: any, url: string) {
		C.UploadFile(url, '', I.FileType.File, false, (message: any) => {
			if (!message.error.code) {
				this.save(message.hash);
			};
		});
	};
	
	onChangeFile (e: any, path: string) {
		C.UploadFile('', path, I.FileType.File, false, (message: any) => {
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