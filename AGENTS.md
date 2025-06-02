
# agents.md

## Overview

This document outlines the architecture and implementation details of the Electron application built with React, TypeScript, and MobX. It covers the project's structure, state management, inter-process communication, and other essential aspects to facilitate understanding and contribution.

## Table of Contents

1. [Project Structure](#project-structure)
2. [State Management with MobX](#state-management-with-mobx)
3. [Electron Integration](#electron-integration)
4. [Inter-Process Communication (IPC)](#inter-process-communication-ipc)
5. [Routing](#routing)
6. [Internationalization (i18n)](#internationalization-i18n)
7. [Testing](#testing)
8. [Build and Packaging](#build-and-packaging)
9. [Development Workflow](#development-workflow)
10. [References](#references)

---

## Project Structure

The project follows a modular structure to separate concerns and enhance maintainability:

```
project-root/
├── public/
├── src/
│   ├── main/               # Electron main process
│   │   └── main.ts
│   ├── renderer/           # React application
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # MobX stores
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Root component
│   │   └── index.tsx       # Entry point
├── package.json
├── tsconfig.json
├── webpack.config.js
└── ...
```

---

## State Management with MobX

MobX is utilized for state management, providing a simple and scalable solution.

- **Store Initialization**: Each domain has its own store class, decorated with `makeAutoObservable` to enable reactivity.

```typescript
import { makeAutoObservable } from 'mobx';

class TodoStore {
  todos = [];

  constructor() {
    makeAutoObservable(this);
  }

  addTodo(todo) {
    this.todos.push(todo);
  }
}

export const todoStore = new TodoStore();
```

- **Context Provider**: Stores are provided to React components via Context API.

```typescript
import React from 'react';
import { todoStore } from './stores/TodoStore';

export const StoreContext = React.createContext({
  todoStore,
});
```

- **Usage in Components**: Components consume stores using the `useContext` hook and are wrapped with `observer`.

```typescript
import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../StoreContext';

const TodoList = observer(() => {
  const { todoStore } = useContext(StoreContext);

  return (
    <ul>
      {todoStore.todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
});

export default TodoList;
```

---

## Electron Integration

Electron enables the creation of cross-platform desktop applications using web technologies.

- **Main Process**:

```typescript
import { app, BrowserWindow } from 'electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);
```

- **Preload Script**:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
```

---

## Inter-Process Communication (IPC)

IPC facilitates communication between the main and renderer processes.

- **Renderer Process**:

```typescript
window.api.send('channel-name', data);
```

- **Main Process**:

```typescript
ipcMain.on('channel-name', (event, data) => {
  event.reply('channel-name-response', responseData);
});
```

---

## Routing

React Router is employed for client-side routing within the renderer process.

```typescript
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const App = () => (
  <Router>
    <Switch>
      <Route path="/" exact component={HomePage} />
      <Route path="/about" component={AboutPage} />
    </Switch>
  </Router>
);
```

---

## Internationalization (i18n)

The application supports multiple languages using `react-intl`.

- **Provider Setup**:

```typescript
import { IntlProvider } from 'react-intl';
import messages_en from './translations/en.json';
import messages_de from './translations/de.json';

const messages = {
  en: messages_en,
  de: messages_de,
};

const language = navigator.language.split(/[-_]/)[0];

const App = () => (
  <IntlProvider locale={language} messages={messages[language]}>
    {/* Application components */}
  </IntlProvider>
);
```

- **Usage in Components**:

```typescript
import { FormattedMessage } from 'react-intl';

const Greeting = () => (
  <p>
    <FormattedMessage id="app.greeting" defaultMessage="Hello, World!" />
  </p>
);
```

---

## Testing

Testing ensures the reliability of the application.

- **Unit Testing**:

```typescript
test('adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

- **Component Testing**:

```typescript
import { render, screen } from '@testing-library/react';
import TodoList from './TodoList';

test('renders todo items', () => {
  render(<TodoList />);
  expect(screen.getByText(/Sample Todo/i)).toBeInTheDocument();
});
```

---

## Build and Packaging

- **Development Build**:

```bash
npm run dev
```

- **Production Build**:

```bash
npm run build
```

- **Packaging**:

```bash
npm run dist
```

---

## Development Workflow

1. **Install Dependencies**:

```bash
npm install
```

2. **Start Development Server**:

```bash
npm run dev
```

3. **Start Electron**:

```bash
npm run electron
```

4. **Run Tests**:

```bash
npm test
```

---

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [MobX Documentation](https://mobx.js.org/README.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Router Documentation](https://reactrouter.com/)
- [react-intl Documentation](https://formatjs.io/docs/react-intl/)
