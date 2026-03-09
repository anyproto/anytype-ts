import * as React from 'react';
import { useState } from 'react';
import { Feature } from '../../lib/feature';

// Mock utility to simulate the app's feature lookup
const isFeatureEnabled = (featureFlag: string): boolean => {
	// In reality this checks S.Record.features or similar
	return featureFlag === Feature.NotionImport;
};

export const ImportNotionPopup: React.FC = () => {
	const [step, setStep] = useState(1);
	const [source, setSource] = useState<'zip' | 'json' | 'api' | null>(null);
	const [apiKey, setApiKey] = useState('');
	const [zipFile, setZipFile] = useState<File | null>(null);
	const [progress, setProgress] = useState({ current: 0, total: 0 });

	if (!isFeatureEnabled(Feature.NotionImport)) return null;

	const handleSourceSelect = (type: 'zip' | 'json' | 'api') => {
		setSource(type);
		setStep(2);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setZipFile(e.target.files[0]);
		}
	};

	const startImport = async () => {
		if (source === 'api' && !apiKey) return alert("API Key is required");
		if (source === 'zip' && !zipFile) return alert("ZIP File is required");

		setStep(4);
		setProgress({ current: 0, total: 100 }); // Mock total

		// Simulate the background import pipeline
		for (let i = 1; i <= 100; i++) {
			await new Promise(r => setTimeout(r, 20)); // Mocking API calls / parsing
			setProgress({ current: i, total: 100 });
		}

		setStep(5);
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
			{source === 'api' && (
				<div>
					<label>Notion API Key:</label>
					<input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} />
				</div>
			)}
			{source === 'zip' && (
				<div>
					<label>Upload ZIP:</label>
					<input type="file" accept=".zip" onChange={handleFileChange} />
				</div>
			)}
			{source === 'json' && (
				<div>
					<p>Select your JSON export folder (mock)</p>
				</div>
			)}
			<p>Estimated import size: X pages, Y databases, Z files</p>
			<button onClick={startImport}>Start Import</button>
		</div>
	);

	const renderStep4 = () => (
		<div>
			<h2>Progress</h2>
			<p>Importing {progress.current} / {progress.total} pages</p>
			<progress value={progress.current} max={progress.total} />
			{progress.current === progress.total && <button onClick={() => setStep(5)}>Finish</button>}
		</div>
	);

	const renderStep5 = () => (
		<div>
			<h2>Summary</h2>
			<p>100 pages imported successfully</p>
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
