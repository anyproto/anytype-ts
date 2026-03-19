import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { ErrorBoundary } from 'Component';
import './component/util/icons';
const root = createRoot(document.getElementById('root'));

root.render(<ErrorBoundary><App /></ErrorBoundary>);