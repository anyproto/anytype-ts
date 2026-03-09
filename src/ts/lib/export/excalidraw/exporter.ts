import { loadExcalidraw } from '../../excalidraw/loader';
import { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';

export async function exportToPng(elements: any[], appState: AppState, files: BinaryFiles): Promise<Blob | null> {
    try {
        const excalidrawMod = await loadExcalidraw();
        const blob = await excalidrawMod.exportToBlob({ elements, appState, files, mimeType: 'image/png' });
        return blob;
    } catch (e) {
        console.error('Failed to export to PNG', e);
        return null;
    }
}

export async function exportToSvg(elements: any[], appState: AppState, files: BinaryFiles): Promise<string> {
    try {
        const excalidrawMod = await loadExcalidraw();
        const svg = await excalidrawMod.exportToSvg({ elements, appState, files });
        return new XMLSerializer().serializeToString(svg);
    } catch (e) {
        console.error('Failed to export to SVG', e);
        return '';
    }
}

export async function exportToExcalidraw(elements: any[], appState: AppState, files: BinaryFiles): Promise<string> {
    return JSON.stringify({
        type: "excalidraw",
        version: 2,
        source: "anytype",
        elements,
        appState,
        files
    });
}
