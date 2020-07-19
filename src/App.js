import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import url from 'url';

const doScan = async (filename) => {
  const parsed = url.parse(window.location.href);
  const formatted = url.format({
    protocol: parsed.protocol,
    port: process.env.REACT_APP_API_PORT,
    hostname: parsed.hostname,
    pathname: '/scan'
  });
  const result = await axios.post(formatted, {
    filename
  });
  return result.data;
};

function App() {
  const [ filename, setFilename ] = useState('');
  const [ result, setResult ] = useState(null);
  const performScan = async (e) => {
    e.preventDefault();
    const result = await doScan(filename);
    setResult(result);
  };
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
	  <form action="#">
	    <input type="text" value={ filename } onChange={ (e) => {
	      e.preventDefault();
	      setFilename(e.target.value);
	    } } />
	    <button type="submit" onClick={ performScan } >Scan!</button>
	  </form>
        </p>
	<p>{ result && (result.error) }</p>
	<p>{ result && result.success && <div><a href={ result.success.link }>{ result.success.link }</a><br /><iframe src={ result.success.link }></iframe></div> }</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
