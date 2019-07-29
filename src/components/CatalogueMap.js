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

import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import {DateRangePicker} from 'react-dates';

import moment from 'moment';

import {Image as ImageLayer} from 'ol/layer.js'
import {ImageCanvas as ImageCanvasSource} from 'ol/source.js';

import {Select as SelectInteraction} from 'ol/interaction';
import * as ConditionEvent from 'ol/events/condition';


import * as geohashpoly from 'geohash-poly';

import RootCatalogue from './RootCatalogue';
//import * as moment from 'moment';
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

      catalogue: null,
      selectedDate: null,
      selectedBand: null,

      dateCatalogs: [],
      datasetBands: [],

      visibleDates: [],
      visibleFeatures: [],
      visibleGeohashes: [],

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
        maxZoom: 20
      })
    });

    map.on('moveend', this.mapMoved.bind(this));
    //var capabilitiesResponse = await fetch('https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml', CACHE_POLICY);
    const capabilitiesResponse = await fetch('/WMTSCapabilities.xml', CACHE_POLICY);
    const parser = new format.WMTSCapabilities();
    const capabilities = parser.read(await capabilitiesResponse.text());
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
    selectionInteraction.on('select', function (e) {
      const selectedFeatures = e.target.getFeatures().getArray();

      const layersBefore = _.keys(cogLayersPerId);
      const selectedKeys = _.map(selectedFeatures, f => f.getId());
      const layersToAdd = _.difference(selectedKeys, layersBefore);
      const layersToRemove = _.difference(layersBefore, selectedKeys);

      that.removeLayersFromMap(layersToRemove, cogLayersPerId);

      that.addLayersToMap(layersToAdd, cogLayersPerId, selectedFeatures);
    });

    this.setState({map, catalogueFeatureLayerSource, catalogueFeatureLayer, selectionInteraction, cogLayersPerId});
  }

  processLink(link) {
    if (window.location.href.startsWith('http://localhost:3000/') && link.startsWith('https://pta.data.lit.fmi.fi/stac/')) {
      link = link.substring('https://pta.data.lit.fmi.fi/stac'.length);
    }
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

      var min, max;
      switch(datasetClass) {
      case 'S1':
        min = -25;
        max = 10;
        break;
      case 'S2':
        min = 0;
        max = 255;
        break;
      default:
        min = _.min(data);
        max = _.max(data);
        if (min === max) { max = min + 1; }
        break;
      }

      for (var x = 0; x < params.width; x++) {
        for (var y = 0; y < params.height; y++) {
          var d = Math.min(Math.max(data[x + y * params.width], min), max);
          var opacity = 255;
          var val = (d - min) / (max - min) * 255;

          if (data[x + y * params.width] === 0) {
            opacity = 0;
          }

          imagedata.data[(x + y * params.width) * 4 + 0] = val;
          imagedata.data[(x + y * params.width) * 4 + 1] = val;
          imagedata.data[(x + y * params.width) * 4 + 2] = val;
          imagedata.data[(x + y * params.width) * 4 + 3] = opacity;
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
        tiff.readRasters({
          bbox: extent,
          width: Math.floor(size[0]), height: Math.floor(size[1])
        }).then(data => {
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

    // We really need just a percision of 2, but the library does not work with precision < 4
    geohashpoly({coords: polygon, precision: 4}, function (err, hashes) {
      if (err) throw err;

      hashes = _.sortBy(_.uniq(_.map(hashes, h => h.substring(0, 2))));

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
      visibleDates.splice(0);
      _.each(dateCatalogs, c => {
        if (c.rel === 'child' && _.isObject(c.dimension) && c.dimension.axis === 'time') {
          if (visibleDates.map(date => date.format()).indexOf(c.dimension.value) === -1) {
            visibleDates.push(moment(c.dimension.value).startOf('day'));
          }
        }
      });
      visibleDates.sort();
      if (visibleDates.indexOf(selectedDate) === -1) {
        selectedDate = null;
      }
      that.setState({visibleDates, selectedDate, dateCatalogs});
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

    dateCatalogs = _.filter(dateCatalogs, c =>
        c.rel === 'child' && _.isObject(c.dimension) &&
        c.dimension.axis === 'time' && c.dimension.value === selectedDate);

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
      this.addLayersToMap(layerKeys, cogLayersPerId, this.state.selectionInteraction.getFeatures().getArray());
      this.setState({cogLayersPerId});
    });
  }


  render() {
    return (
        <div className="CatalogueMap">
          <h1>{this.state.catalogue ? this.state.catalogue.description : '...'} {this.state.selectedDate ? 'at ' + this.state.selectedDate.format() : ''}</h1>
          <div className="CatalogueMapContainer" ref="mapContainer">
          </div>
          <div className="Controls">
            <div>
              <RootCatalogue root={this.props.root} selectCatalogue={catalogue => this.selectCatalogue(catalogue)}/>
            </div>
            {this.state.catalogue ? 
              <div>
              <div>
                <h2>Selected catalog {this.state.catalogue.description}</h2>
                <p>The catalogue spans {this.state.catalogue.properties['dtr:start_datetime']} - {this.state.catalogue.properties['dtr:end_datetime']}</p>
              </div>
              <div>
                <p>Click on dates below to show bounding boxes of sentinel imagery take on that day. Selecting
                  the bounding boxes shows the radar imagery on the map.</p>
              </div>
              <div>
                <p className="VisibleGeohashes">Geohashes in view:
                  {this.state.visibleGeohashes.map((hash, i) => (<span key={i}>{hash}</span>))}
                </p>
              </div>
              <div>
                <p className="VisibleTimes">Dates within:</p>
                <DateRangePicker
                    startDateId="startDate"
                    endDateId="endDate"
                    displayFormat={DATE_FORMAT}
                    startDate={this.state.startDate}
                    endDate={this.state.endDate}
                    onDatesChange={({startDate, endDate}) => {
                      this.selectDateRange(startDate, endDate)
                    }}
                    focusedInput={this.state.focusedInput}
                    onFocusChange={(focusedInput) => this.setState({focusedInput})}
                    initialVisibleMonth={() => moment.min(this.state.visibleDates)}
                    isOutsideRange={date => date < moment.min(this.state.visibleDates) || date > moment.max(this.state.visibleDates)}
                />
                <p className="VisibleTimes">Times available in view:

                  {this.state.visibleDates
                      .filter(date => date >= this.state.startDate && date <= this.state.endDate)
                      .map(
                      (date, i) => (
                          <span
                              key={i}
                              onClick={() => this.selectDate(date)}
                              className={'Time' + (this.state.selectedDate === date ? ' SelectedDate' : '')}>{date.format()}</span>
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
            </div> : <div></div>}
          </div>
        </div>
    );
  }

}

