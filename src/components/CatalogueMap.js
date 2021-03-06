import React, {Component} from 'react';

import {Map, View} from 'ol';
import * as source from 'ol/source';
import * as format from 'ol/format';
import * as layer from 'ol/layer';
import * as style from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON.js';

import {fromLonLat, toLonLat} from 'ol/proj';
import {optionsFromCapabilities} from 'ol/source/WMTS';
import {DropdownButton, MenuItem} from 'react-bootstrap';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import moment from 'moment';

import {Image as ImageLayer} from 'ol/layer.js'
import {ImageCanvas as ImageCanvasSource} from 'ol/source.js';

import {Select as SelectInteraction} from 'ol/interaction';
import * as ConditionEvent from 'ol/events/condition';


import * as geohashpoly from 'geohash-poly';

import RootCatalogue from './RootCatalogue';
import * as _ from 'lodash';

import 'ol/ol.css';
import './CatalogueMap.css';

import * as GeoTIFF from 'geotiff';

import {register} from 'ol/proj/proj4.js';
import proj4 from 'proj4';

proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs');

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs');
proj4.defs('EPSG:3857', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
register(proj4);

//const CACHE_POLICY = {cache: "force-cache"};
const CACHE_POLICY = {};
const MAP_PROJECTION = 'EPSG:3857';
const DATE_FORMAT = "YYYY-MM-DD";
moment.defaultFormat = DATE_FORMAT;


function BandDropDown(props) {
  let bandDict = {
    "band-0": "VH",
    "band-1": "VV"
  };

  return (
      <div>
        <DropdownButton
            bsize="small"
            title={(bandDict[props.selectedBand] || props.selectedBand) || "No dataset or date selected"}
            id="asd"
        >
          {props.bands.map(band =>
              <MenuItem key={band}
                        onSelect={() => props.onBandSelected(band)}>{bandDict[band] || band}</MenuItem>)
          }
        </DropdownButton>
      </div>
  )
}


export default class CatalogueMap extends Component {

  constructor(props) {
    super(props);
    this.state = {
      map: null,
      catalogueFeatureLayer: null,
      catalogueFeatureLayerSource: null,
      selectionInteraction: null,
      cogLayersPerId: {},

      showAllVisibleItems: false,
      catalogue: null,
      selectedDate: null,
      selectedBand: null,

      minAvailableDate: null,
      maxAvailableDate: null,

      dateCatalogs: [],
      datasetBands: [],

      visibleDates: [],
      visibleFeatures: [],
      visibleGeohashes: [],

      loading: 0,

      startDate: null,
      endDate: null,
      focusedInput: null,
    };
    this.itemLoadCounter = 0;
  }

  async componentDidMount() {
    const catalogueFeatureLayerSource = new source.Vector({});
    const catalogueFeatureLayer = new layer.Vector({
      source: catalogueFeatureLayerSource,
      style: feature => new style.Style({
        stroke: new style.Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          width: 1.5,

        }),
        //text: new style.Text({ text: feature.get('name') }),
        fill: new style.Fill({
          color: 'rgba(0, 0, 0, 0)'
        })
      })
    });

    const map = new Map({
      target: this.refs.mapContainer,
      layers: [
        catalogueFeatureLayer
      ],
      overlays: [],
      view: new View({
        center: fromLonLat([24.95, 65.23]),
        zoom: 6,
        minZoom: 4,
        maxZoom: 11
      })
    });

    map.on('moveend', this.mapMoved.bind(this));

    var capabilitiesResponse;
    try {
      // Use the Capabilities from NLS Finland
      capabilitiesResponse = await fetch('https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml', CACHE_POLICY);
      capabilitiesResponse = await capabilitiesResponse.text();
    } catch(e) {
      // .. but if it fails, use the local copy instead
      capabilitiesResponse = await fetch('./WMTSCapabilities.xml', CACHE_POLICY);
      capabilitiesResponse = await capabilitiesResponse.text();
    }
    const parser = new format.WMTSCapabilities();
    const capabilities = parser.read(capabilitiesResponse);
    const opts = optionsFromCapabilities(capabilities, {
      layer: 'taustakartta',
      matrixSet: 'WGS84_Pseudo-Mercator',
      requestEncoding: 'REST'
    });
    const wmtsLayer = new layer.Tile({
      source: new source.WMTS(opts)
    });
    wmtsLayer.setZIndex(-1);
    map.addLayer(wmtsLayer);


    // Map layer selection to adding cog layers
    const that = this;

    const cogLayersPerId = {};

    const selectionInteraction = new SelectInteraction({
      condition: ConditionEvent.click,
      style: feature => new style.Style({
        stroke: new style.Stroke({
          color: 'rgba(0, 0, 255, 0.5)',
          width: 2.5
        }),
        //text: new style.Text({ text: feature.get('name') }),
        fill: new style.Fill({
          color: 'rgba(0, 0, 0, 0)'
        })
      })
    });
    map.addInteraction(selectionInteraction);
    selectionInteraction.on('select', that.updateFeaturesOnMap.bind(that));

    this.setState({map, catalogueFeatureLayerSource, catalogueFeatureLayer, selectionInteraction, cogLayersPerId});
  }

  updateFeaturesOnMap(selectEvent) {
    const cogLayersPerId = this.state.cogLayersPerId;

    var selectedFeatures = this.getVisibleFeatures(selectEvent);

    const layersBefore = _.keys(cogLayersPerId);
    const selectedKeys = _.map(selectedFeatures, f => f.getId());
    const layersToAdd = _.difference(selectedKeys, layersBefore);
    const layersToRemove = _.difference(layersBefore, selectedKeys);

    this.removeLayersFromMap(layersToRemove, cogLayersPerId);

    this.addLayersToMap(layersToAdd, cogLayersPerId, selectedFeatures);
  }

  getVisibleFeatures(selectEvent) {
    const catalogueFeatureLayerSource = this.state.catalogueFeatureLayerSource;
    const showAllVisibleItems = this.state.showAllVisibleItems;
    var ret;
    if (showAllVisibleItems) {
      ret = catalogueFeatureLayerSource.getFeatures();
    } else {
      if (selectEvent) {
        ret = selectEvent.target.getFeatures().getArray();
      } else {
        ret = this.state.selectionInteraction.getFeatures().getArray();
      }
    }
    return ret;
  }

  processLink(link) {
    /*
    if (window.location.href.startsWith('http://localhost:3000/') && link.startsWith('https://pta.data.lit.fmi.fi/stac/')) {
      link = link.substring('https://pta.data.lit.fmi.fi/stac'.length);
    } else if (window.location.href.startsWith('https://stac-proto.spatineo-devops.com/') && link.startsWith('https://pta.data.lit.fmi.fi/stac/')) {
      link = link.substring('https://pta.data.lit.fmi.fi/stac'.length);
    }*/
    return link;
  }

  removeLayersFromMap(layersToRemove, cogLayersPerId) {
    _.each(layersToRemove, s => {
      if (cogLayersPerId[s] !== 'pending') {
        this.state.map.removeLayer(cogLayersPerId[s]);
      }
      delete cogLayersPerId[s];
    });
  }

  addLayersToMap(layersToAdd, cogLayersPerId, selectedFeatures) {
    _.each(layersToAdd, s => {
      cogLayersPerId[s] = 'pending';

      const feature = _.find(selectedFeatures, f => f.getId() === s);
      const stac = feature.get('stac_item');

      this.createCogLayer(stac).then(layer => {
        if (cogLayersPerId[s] !== 'pending') return;
        this.state.map.addLayer(layer);
        cogLayersPerId[s] = layer;
      });
    })
  }

  async createCogLayer(stacJson) {
    const that = this;
    const asset = stacJson.assets[this.state.selectedBand] || stacJson.assets[_.keys(stacJson.assets)[0]];
    const url = asset.href;

    const tiff = await GeoTIFF.fromUrl(url);
    let canvasLayer;

    const retrievedData = {
      forCounter: null,
      forChecksum: null,
      data: null
    };

    const drawRetrievedData = function (extent, resolution, pixelRatio, size, projection) {
      var params = {width: Math.floor(size[0]), height: Math.floor(size[1])};

      let canvas = document.createElement('canvas');
      canvas.width = params.width;
      canvas.height = params.height;
      let context = canvas.getContext('2d');

      var imagedata = context.createImageData(params.width, params.height);

      var data = retrievedData.data[0];

      var datasetClass = stacJson.id.substring(0,2);

      var colorFn;

      
      switch(datasetClass) {
        case 'S1':
          colorFn = (() => {
          return function(d) {
            var min = -25, max = 10;
            var opacity = d === 0 ? 0 : 255;
            d = Math.min(Math.max(d, min), max);
            var val = (d - min) / (max - min) * 255;

            return [val, val, val, opacity];
          }
        })();
        break;
        case 'S1DM':
          colorFn = (() => {
          return function(d) {
            var min = -25, max = 10;
            var opacity = d === 0 ? 0 : 255;
            d = Math.min(Math.max(d, min), max);
            var val = (d - min) / (max - min) * 255;

            return [val, val, val, opacity];
          }
        })();
        break;
        case 'S1M':
          colorFn = (() => {
          return function(d) {
            var min = -2500, max = 1000;
            var opacity = d === 0 ? 0 : 255;
            d = Math.min(Math.max(d, min), max);
            var val = (d - min) / (max - min) * 255;

            return [val, val, val, opacity];
          }
        })();
        break;
        case 'S2IM':
          colorFn = (() => {
            var min = 0;
            var max = 225; // real data looks to be between 0 and 200, this seems like a good compromise
  
            return function(d) {
              var opacity = d === 0 ? 0 : 255;
              d = Math.min(Math.max(d, min), max);
              var val = (d - min) / (max - min);
              var r = val < .5 ? 1         : 1-(val-.5)*2;
              var g = val < .5 ? 0+(val)*2 : 1;
  
              return [r * 255, g * 255, 0, opacity];
            }
          })();
        break;
        case 'S2RM':
          colorFn = (() => {
            var min = 0;
            var max = 5000; // real data looks to be between 0 and 200, this seems like a good compromise
  
            return function(d) {
              var opacity = d === 0 ? 0 : 255;
              d = Math.min(Math.max(d, min), max);
              var val = (d - min) / (max - min);
              var r = val < .5 ? 1         : 1-(val-.5)*2;
              var g = val < .5 ? 0+(val)*2 : 1;
  
              return [r * 255, g * 255, 0, opacity];
            }
          })();
        break;
        default:
        // Auto-detect min and max and draw a black-white gradient
        colorFn = (() => {
          var min = _.min(data);
          var max = _.max(data);
          if (min === max) { max = min + 1; }
          return function(d) {
            var opacity = d === 0 ? 0 : 255;
            d = Math.min(Math.max(d, min), max);
            var val = (d - min) / (max - min) * 255;

            return [val, val, val, opacity];
          }
        })();
        break;
      }

      for (var x = 0; x < params.width; x++) {
        for (var y = 0; y < params.height; y++) {
          var tmp = colorFn(data[x + y * params.width]);
          imagedata.data[(x + y * params.width) * 4 + 0] = tmp[0];
          imagedata.data[(x + y * params.width) * 4 + 1] = tmp[1];
          imagedata.data[(x + y * params.width) * 4 + 2] = tmp[2];
          imagedata.data[(x + y * params.width) * 4 + 3] = tmp[3];
        }
      }

      context.putImageData(imagedata, 0, 0);
      return canvas;
    };

    function calculateChecksum(obj) {
      var tmp = JSON.stringify(obj);
      var hash = 0, i, chr;
      if (tmp.length === 0) return hash;
      for (i = 0; i < tmp.length; i++) {
        chr   = tmp.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    let counter = 0;
    const canvasFunction = function (extent, resolution, pixelRatio, size, projection) {
      var thisCounter = ++counter;
      var thisChecksum = calculateChecksum({extent, resolution, pixelRatio, size, projection});

      if (retrievedData.forCounter === thisCounter && retrievedData.forChecksum === thisChecksum) {
        return drawRetrievedData(extent, resolution, pixelRatio, size, projection);

      } else {
        that.state.loading++; that.setState({ loading: that.state.loading });

        tiff.readRasters({
          bbox: extent,
          width: Math.floor(size[0]), height: Math.floor(size[1])
        }).then(data => {
          that.state.loading--; that.setState({ loading: that.state.loading });
          if (thisCounter !== counter) {
            // Stale call, ignore
            return;
          }
          retrievedData.forCounter = thisCounter + 1;
          retrievedData.forChecksum = thisChecksum;
          retrievedData.data = data;
          canvasLayer.getSource().changed();
        });

      }

      // This fixes some redraw issues (but not all), but then the layer vanishes when pannin/zooming before new data is available
      //return document.createElement('canvas');
      return null;
    };

    canvasLayer = new ImageLayer({
      source: new ImageCanvasSource({
        canvasFunction: canvasFunction,
        projection: 'EPSG:3067'
      }),
      // TODO: bbox?
      opacity: 0.85
    });

    return canvasLayer;
  }

  mapMoved(evt) {
    const map = evt.map;
    const extent = map.getView().calculateExtent(map.getSize());

    const latLonMin = toLonLat([extent[0], extent[1]], MAP_PROJECTION);
    const latLonMax = toLonLat([extent[2], extent[3]], MAP_PROJECTION);

    const polygon = [[
      [latLonMin[0], latLonMin[1]],
      [latLonMin[0], latLonMax[1]],
      [latLonMax[0], latLonMax[1]],
      [latLonMax[0], latLonMin[1]],
      [latLonMin[0], latLonMin[1]]
    ]];

    const that = this;

    geohashpoly({coords: polygon, precision: 2, hashMode: 'intersect' }, function (err, hashes) {
      if (err) throw err;

      hashes = _.sortBy(_.uniq(_.map(hashes, h => h.substring(0, 2)))); // substring ensures precision 2 geohashes

      if (!_.isEqual(hashes, that.state.visibleGeohashes)) {
        that.setState({visibleGeohashes: hashes});
        if (that.state.catalogue != null) {
          that.loadGeohashCatalogues(hashes);
        }
      }
    });
  }

  loadGeohashCatalogues(hashes) {
    const that = this;
    const promises = _.map(hashes, h => {
      if (that.state.catalogue != null) {
        var catalogueLink = _.find(that.state.catalogue.links,
            l => (l.rel === 'child' && _.isObject(l.dimension) && l.dimension.axis === 'geohash' && l.dimension.value === h));
        var url;

        if (!catalogueLink) {
          //console.error('No catalogue link for hash '+h);
          return;
        }

        url = that.processLink(catalogueLink.href);
        return fetch(url, CACHE_POLICY).then(response => response.json());
      }
    });

    function showItemBboxes(values) {
      const dateCatalogs = _.reduce(values, (memo, v) => {
        _.each(v.links, l => memo.push(l));
        return memo;
      }, []);
      let visibleDates = that.state.visibleDates;
      let selectedDate = that.state.selectedDate;

      let dateCache = {};

      visibleDates.splice(0);
      _.each(dateCatalogs, c => {
        if (c.rel === 'child' && _.isObject(c.dimension) && c.dimension.axis === 'time') {
          if (!dateCache[c.dimension.value]) {
            var startOfDay = moment(c.dimension.value).startOf('day');
            visibleDates.push(startOfDay);
            dateCache[c.dimension.value] = 1;
          }
        }
      });
      visibleDates.sort((a,b) => a.diff(b));
      
      if (!_.find(visibleDates, d => d.isSame(selectedDate, 'day'))) {
        selectedDate = null;
      }

      let minAvailableDate = new Date(that.state.catalogue.properties['dtr:start_datetime']);
      let maxAvailableDate = new Date(that.state.catalogue.properties['dtr:end_datetime']);

      that.setState({visibleDates, selectedDate, dateCatalogs, minAvailableDate, maxAvailableDate});
      if (selectedDate !== null) {
        that.retrieveAndShowItems(selectedDate);
      }
    }

    Promise.all(_.filter(promises, p => !!p)).then(showItemBboxes);
  }

  retrieveAndShowItems(selectedDate) {
    const that = this;
    let dateCatalogs = this.state.dateCatalogs;

    const thisCounter = ++that.itemLoadCounter;

    var momentSelectedDate = null;
    if (selectedDate) {
      momentSelectedDate = moment(selectedDate);
    }

    dateCatalogs = _.filter(dateCatalogs, c =>
        c.rel === 'child' && _.isObject(c.dimension) &&
        c.dimension.axis === 'time' &&
        (selectedDate && momentSelectedDate.isSame(c.dimension.value, 'day')));

    const promises = _.map(dateCatalogs, link => {
      var url = that.processLink(link.href);
      return fetch(url, CACHE_POLICY).then(response => response.json());
    });

    Promise.all(promises).then(values => {
      if (thisCounter !== that.itemLoadCounter) return; // Abandon feature from previous load

      that.clearFeatures();

      let itemLinks = _.reduce(values, (memo, v) => {
        _.each(v.links, l => memo.push(l));
        return memo;
      }, []);
      itemLinks = _.filter(itemLinks, l => l.rel === 'item');

      const uniqueItemLinks = _.uniqBy(itemLinks, 'href');

      _.each(uniqueItemLinks, async link => {
        const url = that.processLink(link.href);
        const response = await fetch(url, CACHE_POLICY);
        const json = await response.json();

        if (_.isEmpty(that.state.datasetBands)) {
          let datasetBands = _.sortBy(_.keys(json.assets));
          let selectedBand = datasetBands[0]; // Just take the first band initially
          that.setState({datasetBands, selectedBand});
        }

        if (thisCounter !== that.itemLoadCounter) return; // Abandon feature from previous load
        const feature = new GeoJSON().readFeatureFromObject(json, {
          dataProjection: 'EPSG:4326',
          featureProjection: MAP_PROJECTION
        });

        that.addFeature(feature, json);
        that.updateFeaturesOnMap();
      });
      
    });
  }

  clearFeatures() {
    const visibleFeatures = this.state.visibleFeatures;
    this.state.catalogueFeatureLayerSource.clear();
    visibleFeatures.splice(0);
    this.setState({visibleFeatures});
  }

  addFeature(feature, stacJson) {
    const visibleFeatures = this.state.visibleFeatures;

    feature.set('stac_item', stacJson);

    this.state.catalogueFeatureLayerSource.addFeature(feature);

    visibleFeatures.push(feature);
    this.setState({visibleFeatures});
  }

  selectDate(selectedDate) {
    if (this.state.selectedDate === selectedDate) {
      // => unselect
      selectedDate = null;
    }

    this.clearDatasetFeatures();

    this.setState({selectedDate});
    let selectedDateString = selectedDate != null ? selectedDate.format() : null;
    this.retrieveAndShowItems(selectedDateString);
  }

  clearDatasetFeatures() {
    // Clear selection
    this.state.selectionInteraction.getFeatures().clear();

    // Remove cog layers
    _.each(this.state.cogLayersPerId, (v, k) => {
      if (v !== 'pending') {
        this.state.map.removeLayer(v);
      }
      delete this.state.cogLayersPerId[k];
    });
  }

  selectDateRange(startDate, endDate) {
    // moment("2019-06-20", DATE_FORMAT)
    this.setState({startDate, endDate});
    if (this.state.selectedDate < startDate || this.state.selectedDate > endDate) {
      this.setState({selectedDate: null}, () => this.selectDate(null));
    }
  }

  async selectCatalogue(catalogue) {
    if (catalogue != null) {
      const tmp = await fetch(this.processLink(catalogue), CACHE_POLICY);
      catalogue = await tmp.json();
    }

    if (!_.isEqual(catalogue, this.state.catalogue)) {
      this.clearDatasetFeatures();
      this.clearFeatures();
      let datasetBands = this.state.datasetBands;
      datasetBands.splice(0);
      this.setState({selectedBand: null, datasetBands});
    }
    this.setState({catalogue},
        () => this.loadGeohashCatalogues(this.state.visibleGeohashes));
  }

  selectBand(selectedBand) {
    this.setState({selectedBand}, () => {
      let cogLayersPerId = this.state.cogLayersPerId;
      let layerKeys = _.keys(cogLayersPerId);
      this.removeLayersFromMap(layerKeys, cogLayersPerId);
      this.addLayersToMap(layerKeys, cogLayersPerId, this.getVisibleFeatures());
      this.setState({cogLayersPerId});
    });
  }

  toggleShowAllVisibleItems() {
    const showAllVisibleItems = !this.state.showAllVisibleItems;
    this.setState({ showAllVisibleItems }, this.updateFeaturesOnMap.bind(this));
  }

  render() {
    return (
        <div className="CatalogueMap">
          <h1>{this.state.catalogue ? this.state.catalogue.description : '...'} {this.state.selectedDate ? 'at ' + this.state.selectedDate.format() : ''}</h1>
          <div className={"CatalogueMapContainer "+(this.state.loading > 0 ? "LoadingGeotiff" : "")} ref="mapContainer">
          </div>
          <div className="Controls">
            <div>
              <RootCatalogue root={this.props.root} selectCatalogue={catalogue => this.selectCatalogue(catalogue)}/>
            </div>
            {this.state.catalogue ? 
              <div>
              <div>
                <h2>Catalog "{this.state.catalogue.description}"</h2>
              </div>
              <div>
                <p>Choose a time span and then click on dates below to show bounding boxes of sentinel imagery take on that day. Selecting
                  the bounding boxes shows the satellite sensor data on the map.</p>
              </div>
              <div>
                <p className="VisibleTimes">Dates within:</p>
                <div className="DatePickers">
                  <DatePicker
                      selected={this.state.startDate}
                      selectsStart
                      showMonthDropdown
                      showYearDropdown
                      openToDate={this.state.startDate || this.state.minAvailableDate}
                      startDate={this.state.startDate}
                      endDate={this.state.endDate}
                      minDate={this.state.minAvailableDate}
                      maxDate={this.state.maxAvailableDate}
                      onChange={(startDate) => {
                        this.selectDateRange(startDate, this.state.endDate)
                      }}
                      placeholderText="Start date"
                  />

                  <DatePicker
                      selected={this.state.endDate}
                      selectsEnd
                      showMonthDropdown
                      showYearDropdown
                      openToDate={this.state.endDate || this.state.startDate|| this.state.maxAvailableDate}
                      startDate={this.state.startDate}
                      endDate={this.state.endDate}
                      minDate={this.state.minAvailableDate}
                      maxDate={this.state.maxAvailableDate}
                      onChange={(endDate) => {
                        this.selectDateRange(this.state.startDate, endDate)
                      }}
                      placeholderText="End date"
                  />
                </div>
                <p className="showAllVisibleItems">
                  <label>Show all visible items on map<input type="checkbox" checked={this.state.showAllVisibleItems} onChange={this.toggleShowAllVisibleItems.bind(this)}/></label>
                </p>
                <p className="VisibleTimes">Times available in view:
                  {this.state.visibleDates
                      .filter(date => date.isBetween(this.state.startDate, this.state.endDate, 'day', '[]'))
                      .map(
                      (date, i) => (
                          <span
                              key={i}
                              onClick={() => this.selectDate(date)}
                              className={'Time' + (date.isSame(this.state.selectedDate, 'day') ? ' SelectedDate' : '')}>{date.format()}</span>
                      )
                  )}
                </p>
              </div>
              <div>
                <p>Number of STAC items
                  visible: {this.state.selectedDate === null ? 'choose a date above' : this.state.visibleFeatures.length}</p>
              </div>
              <div>
                <h3>Choose band</h3>
                <BandDropDown selectedBand={this.state.selectedBand} bands={this.state.datasetBands}
                              onBandSelected={selectedBand => this.selectBand(selectedBand)}/>
              </div>
              <h3>Debug information</h3>
              <div>
                <p>Data from {moment(this.state.catalogue.properties['dtr:start_datetime']).format('LL')} to {moment(this.state.catalogue.properties['dtr:end_datetime']).format('LL')}</p>
                <p className="VisibleGeohashes">Visible geohashes:
                  {this.state.visibleGeohashes.map((hash, i) => (<span key={i}>{hash}</span>))}
                </p>
              </div>
            </div> : <div></div>}
          </div>
        </div>
    );
  }

}

