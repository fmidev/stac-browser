import React, {Component} from 'react';

import {Map, View} from 'ol';
import * as source from 'ol/source';
import * as format from 'ol/format';
import * as layer from 'ol/layer';
import * as style from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON.js';

import {fromLonLat, toLonLat} from 'ol/proj';
import {optionsFromCapabilities} from 'ol/source/WMTS';

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

      dateCatalogs: [],

      visibleDates: [],
      visibleFeatures: [],
      visibleGeohashes: []
    };
    this.itemLoadCounter = 0
  }

  async componentDidMount() {
    var catalogueFeatureLayerSource = new source.Vector({});
    var catalogueFeatureLayer = new layer.Vector({
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

    var map = new Map({
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
    var capabilitiesResponse = await fetch('/WMTSCapabilities.xml', CACHE_POLICY);
    var parser = new format.WMTSCapabilities();
    var capabilities = parser.read(await capabilitiesResponse.text());
    var opts = optionsFromCapabilities(capabilities, {
      layer: 'taustakartta',
      matrixSet: 'WGS84_Pseudo-Mercator',
      requestEncoding: 'REST'
    });
    var wmtsLayer = new layer.Tile({
      source: new source.WMTS(opts)
    });
    wmtsLayer.setZIndex(-1);
    map.addLayer(wmtsLayer);


    // Map layer selection to adding cog layers
    var that = this;

    var cogLayersPerId = {};

    var selectionInteraction = new SelectInteraction({
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
      var selectedFeatures = e.target.getFeatures().getArray();

      var layersBefore = _.keys(cogLayersPerId);
      var selectedKeys = _.map(selectedFeatures, f => f.getId());
      var layersToAdd = _.difference(selectedKeys, layersBefore);
      var layersToRemove = _.difference(layersBefore, selectedKeys);

      _.each(layersToRemove, s => {
        if (cogLayersPerId[s] !== 'pending') {
          map.removeLayer(cogLayersPerId[s]);
        }
        delete cogLayersPerId[s];
      });

      _.each(layersToAdd, s => {
        cogLayersPerId[s] = 'pending';

        var feature = _.find(selectedFeatures, f => f.getId() === s);
        var stac = feature.get('stac_item');

        that.createCogLayer(stac).then(layer => {
          if (cogLayersPerId[s] !== 'pending') return;
          map.addLayer(layer);
          cogLayersPerId[s] = layer;
        });
      })
    });

    this.setState({map, catalogueFeatureLayerSource, catalogueFeatureLayer, selectionInteraction, cogLayersPerId});
  }


  async createCogLayer(stacJson) {
    // Just load the first asset
    var asset = stacJson.assets['band-0'] || stacJson.assets[_.keys(stacJson.assets)[0]];
    var url = asset.href;

    var tiff = await GeoTIFF.fromUrl(url);
    var canvasLayer;

    var retrievedData = {
      forCounter: null,
      data: null
    };

    var drawRetrievedData = function (extent, resolution, pixelRatio, size, projection) {
      var params = {width: Math.floor(size[0]), height: Math.floor(size[1])};

      let canvas = document.createElement('canvas');
      canvas.width = params.width;
      canvas.height = params.height;
      let context = canvas.getContext('2d');

      var imagedata = context.createImageData(params.width, params.height);

      var data = retrievedData.data[0];


      /** Dynamic min/max values, downside: fluctuations
       var min = _.min(data);
       var max = _.max(data);
       if (min === max) { max = min + 1; }
       console.log('min, max = ',min, max)
       */

      var min = -25;
      var max = 10;

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

    var counter = 0;
    var canvasFunction = function (extent, resolution, pixelRatio, size, projection) {
      var thisCounter = ++counter;

      if (retrievedData.forCounter === thisCounter) {
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
      opacity: 0.8
    });

    return canvasLayer;
  }

  mapMoved(evt) {
    var map = evt.map;
    var extent = map.getView().calculateExtent(map.getSize());

    var latLonMin = toLonLat([extent[0], extent[1]], MAP_PROJECTION);
    var latLonMax = toLonLat([extent[2], extent[3]], MAP_PROJECTION);

    var polygon = [[
      [latLonMin[0], latLonMin[1]],
      [latLonMin[0], latLonMax[1]],
      [latLonMax[0], latLonMax[1]],
      [latLonMax[0], latLonMin[1]],
      [latLonMin[0], latLonMin[1]]
    ]];

    var that = this;

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
    var that = this;
    var promises = _.map(hashes, h => {
      if (that.state.catalogue != null) {
        var catalogueLink = _.find(that.state.catalogue.links,
            l => (l.rel === 'child' && _.isObject(l.dimension) && l.dimension.axis === 'geohash' && l.dimension.value === h));
        var url;

        if (!catalogueLink) {
          //console.error('No catalogue link for hash '+h);
          return;
        }

        url = catalogueLink.href.substr('http://fmi.stac.fi'.length);
        return fetch(url, CACHE_POLICY).then(response => response.json());
      }
    });


    function showItemBboxes(values) {
      var dateCatalogs = _.reduce(values, (memo, v) => {
        _.each(v.links, l => memo.push(l));
        return memo;
      }, []);
      var visibleDates = that.state.visibleDates;
      var selectedDate = that.state.selectedDate;
      visibleDates.splice(0);
      _.each(dateCatalogs, c => {
        if (c.rel === 'child' && _.isObject(c.dimension) && c.dimension.axis === 'time') {
          if (visibleDates.indexOf(c.dimension.value) === -1) {
            visibleDates.push(c.dimension.value);
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
    var that = this;
    var dateCatalogs = this.state.dateCatalogs;

    var thisCounter = ++that.itemLoadCounter;

    dateCatalogs = _.filter(dateCatalogs, c =>
        c.rel === 'child' && _.isObject(c.dimension) &&
        c.dimension.axis === 'time' && c.dimension.value === selectedDate);

    var promises = _.map(dateCatalogs, link => {
      var url = link.href.substr('http://fmi.stac.fi'.length);
      return fetch(url, CACHE_POLICY).then(response => response.json());
    });

    Promise.all(promises).then(values => {
      if (thisCounter !== that.itemLoadCounter) return; // Abandon feature from previous load

      that.clearFeatures();

      var itemLinks = _.reduce(values, (memo, v) => {
        _.each(v.links, l => memo.push(l));
        return memo;
      }, []);
      itemLinks = _.filter(itemLinks, l => l.rel === 'item');

      var uniqueItemLinks = _.uniqBy(itemLinks, 'href');

      _.each(uniqueItemLinks, async link => {
        // TODO: generalize!
        var url = link.href.substr('http://fmi.stac.fi'.length).replace(/.json$/, '.dim.json');
        var response = await fetch(url, CACHE_POLICY);
        var json = await response.json();
        if (thisCounter !== that.itemLoadCounter) return; // Abandon feature from previous load
        var feature = new GeoJSON().readFeatureFromObject(json, {
          dataProjection: 'EPSG:4326',
          featureProjection: MAP_PROJECTION
        });

        that.addFeature(feature, json);
      });
    });
  }

  clearFeatures() {
    var visibleFeatures = this.state.visibleFeatures;
    this.state.catalogueFeatureLayerSource.clear();
    visibleFeatures.splice(0);
    this.setState({visibleFeatures});
  }

  addFeature(feature, stacJson) {
    var visibleFeatures = this.state.visibleFeatures;

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

    // Clear selection
    this.state.selectionInteraction.getFeatures().clear();

    // Remove cog layers
    _.each(this.state.cogLayersPerId, (v, k) => {
      if (v !== 'pending') {
        this.state.map.removeLayer(v);
      }
      delete this.state.cogLayersPerId[k];
    });

    this.setState({selectedDate});
    this.retrieveAndShowItems(selectedDate);
  }

  async selectCatalogue(catalogue) {
    if (catalogue != null) {
      var tmp = await fetch(catalogue, CACHE_POLICY);
      catalogue = await tmp.json();
    }
    this.setState({catalogue: catalogue},
        () => this.loadGeohashCatalogues(this.state.visibleGeohashes));
  }

  render() {
    return (
        <div className="CatalogueMap">
          <h1>{this.state.catalogue ? this.state.catalogue.description : '...'} {this.state.selectedDate ? 'at ' + this.state.selectedDate : ''}</h1>
          <div className="CatalogueMapContainer" ref="mapContainer">
          </div>
          <div className="Controls">
            <div>
              <RootCatalogue root={this.props.root} selectCatalogue={this.selectCatalogue.bind(this)}/>
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
              <p className="VisibleTimes">Times available in view:
                {this.state.visibleDates.map(
                    (date, i) => (
                        <span
                            key={i}
                            onClick={() => this.selectDate(date)}
                            className={'Time' + (this.state.selectedDate === date ? ' SelectedDate' : '')}>{date}</span>
                    )
                )}
              </p>
            </div>

            <div>
              <p>Number of STAC items
                visible: {this.state.selectedDate === null ? 'choose a date above' : this.state.visibleFeatures.length}</p>
            </div>
          </div>

        </div>
    );
  }

}

