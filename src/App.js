import React, { Component } from 'react';
import './App.css';

import CatalogueMap from './components/CatalogueMap';

export default class App extends Component {
  constructor(props) {
    super(props);
    document.title = 'FMI STAC Proto';
  }
  render() {
    return (
        <div className="App">
          <header className="App-header"></header>
          <CatalogueMap root="https://pta.data.lit.fmi.fi/stac/catalog/root.json" />
          <div className="Explanation">
            {/* <h1>What is this?</h1> */}
            <details>
              <summary>Information</summary>
              <p>
                This is a demonstration of a prototype <a href="https://github.com/radiantearth/stac-spec">STAC catalogue</a> and <a href="https://www.cogeo.org/">cloud optimized geotiffs</a>. The <a href="/catalog/root.json">catalogue</a> used in this application contains a subset of the Sentinel 1 imagery hosted by <a href="http://space.fmi.fi/">FMI Space and Earth Observation Centre</a>.
              </p>
              <p>
                This catalogue is structured as: <span className="CatalogueStructure">root -> dataset -> grid (2 character geohash) -> date -> items</span>. Using this structure allows a browser to efficiently find subcatalogues that contain items for the current view. It also provides the user with information about what data is available.
              </p>
              <p>
                There is a simple extension to STAC in this catalogue. Links to subcatalogues contain dimension information that provides the client with information about the catalogue structure and helps the client traverse the tree efficiently. This catalogue uses the dimensions 'geohash' and 'time':
              </p>
              <ul>
                <li>Geohash: catalogue tree contains items that overlap with the two character geohash tile</li>
                <li>Time: catalogue tree contains items that were aquired (radar pass started at) on that date (UTC)</li>
              </ul>

              <p>
                The map above is created with <a href="https://openlayers.org/">OpenLayers</a>. Cloud optimized geotiffs are processed fully in browser using <a href="https://geotiffjs.github.io/geotiff.js/">geotiff.js</a>. Background maps are made by <a href="https://www.maanmittauslaitos.fi/en/maps-and-spatial-data">National Land Survey Finland</a>. The web application is built with <a href="https://reactjs.org/">React</a>.
              </p>
              <p>
                Prototype developed by <a href="https://fmi.fi" target="_blank" rel="noopener noreferrer"><img alt="Finnish Meteorological Institute" src="./il-logo-fmi-rgb-229x115px.png" className="Logo FMI"/></a> <a href="https://www.spatineo.com" target="_blank" rel="noopener noreferrer"><img alt="Spatineo" src="./SpatineoLogo_Reverse.png" className="Logo"/></a>
              </p>
            </details>
          </div>
        </div>
    );
  }
}

