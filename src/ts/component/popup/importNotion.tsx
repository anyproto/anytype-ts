import * as React from 'react';
import { useState } from 'react';
import { Feature } from '../../lib/feature';

export const ImportNotionPopup: React.FC = () => {
	const [step, setStep] = useState(1);
	const [source, setSource] = useState<'zip' | 'json' | 'api' | null>(null);
	const [apiKey, setApiKey] = useState('');
	const [progress, setProgress] = useState({ current: 0, total: 0 });

	if (!Feature.NotionImport) return null;

	const handleSourceSelect = (type: 'zip' | 'json' | 'api') => {
		setSource(type);
		setStep(2);
	};

	const startImport = () => {
		setStep(4);
		setProgress({ current: 0, total: 100 }); // Mock total
	};

	const renderStep1 = () => (
		<div>
			<h2>Choose source</h2>
			<button onClick={() => handleSourceSelect('zip')}>Upload Notion ZIP export</button>
			<button onClick={() => handleSourceSelect('json')}>Import from API JSON folder</button>
			<button onClick={() => handleSourceSelect('api')}>Connect with Notion API key</button>
		</div>
	);

	const renderStep2 = () => (
		<div>
			<h2>Preview & configure</h2>
			<p>Estimated import size: X pages, Y databases, Z files</p>
			<button onClick={startImport}>Start Import</button>
		</div>
	);

	const renderStep4 = () => (
		<div>
			<h2>Progress</h2>
			<p>Importing {progress.current} / {progress.total} pages</p>
			<progress value={progress.current} max={progress.total} />
			<button onClick={() => setStep(5)}>Finish</button>
		</div>
	);

	const renderStep5 = () => (
		<div>
			<h2>Summary</h2>
			<p>X pages, Y databases, Z files imported</p>
			<p>W errors</p>
			<button>Open imported content</button>
		</div>
	);

	return (
		<div data-feature="notion-import">
			{step === 1 && renderStep1()}
			{step === 2 && renderStep2()}
			{step === 4 && renderStep4()}
			{step === 5 && renderStep5()}
		</div>
	);
};
