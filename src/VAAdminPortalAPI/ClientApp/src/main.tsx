import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import {
  FluentProvider,
  createLightTheme,
  type BrandVariants,
} from '@fluentui/react-components';
import { store } from './app/store';
import App from './App';
import './index.css';

const teamsBrand: BrandVariants = {
  10: '#08090f',
  20: '#17182b',
  30: '#24264a',
  40: '#303266',
  50: '#3d3f7d',
  60: '#4b4e97',
  70: '#5b5fc7',
  80: '#6264a7',
  90: '#797dcf',
  100: '#9296d9',
  110: '#aaaee3',
  120: '#c3c6ed',
  130: '#d9daf4',
  140: '#e8e9f8',
  150: '#f1f2fa',
  160: '#f8f8fc',
};

const teamsLightTheme = createLightTheme(teamsBrand);
teamsLightTheme.fontFamilyBase = "'Segoe UI', 'Segoe UI Variable', sans-serif";
teamsLightTheme.colorNeutralBackground2 = '#f5f5f5';
teamsLightTheme.colorNeutralBackground3 = '#ebebeb';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <FluentProvider theme={teamsLightTheme}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </FluentProvider>
    </Provider>
  </React.StrictMode>,
);
