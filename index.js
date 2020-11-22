import React from 'react';
import ReactDOM from 'react-dom';

import App from './src/App.js';

if (module.hot) {
	module.hot.accept();
}

ReactDOM.render(
	<App />,
	document.getElementById('root')
);