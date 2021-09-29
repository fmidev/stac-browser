import * as React from 'react'
import { createStyles, makeStyles } from '@material-ui/styles'
import { useDispatch, useSelector } from 'react-redux'
import { updateMapExtent } from '../../../Store/Actions/data'
import { Layer } from 'ol/layer';
import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import Projection from 'ol/proj/Projection';
import * as ol from 'ol'
import { MouseWheelZoom, defaults } from 'ol/interaction';
import 'ol/ol.css'

const RED = 0;
const GREEN = 1;
const BLUE = 2;

const projection = new Projection({
  code: 'EPSG:3067',
  extent: [50199.4814, 6582464.0358, 761274.6247, 7799839.8902],
});

const mouseWheelZoomAnimationTime = 75;

interface Props {
  items: any[],
  datasetCatalog: any,
  channelSettings: any
}

const OpenLayersMap: React.FC<Props> = ({ items, datasetCatalog, channelSettings }) => {
  const mapExtent = useSelector((state: any) => state.dataReducer.data.global.mapExtent)
  const sidebarIsOpen = useSelector((state: any) => state.dataReducer.data.global.sidebarIsOpen)
  const dispatch = useDispatch()

  const [map, setMap] = React.useState<any>()
  const [layerConfig, setLayerConfig] = React.useState({ sources: [] as any[] })

  const mapRef = React.useRef<HTMLElement>()

  const initializeOL = React.useCallback(() => {
    const map = new ol.Map({
      interactions: defaults({ mouseWheelZoom: false }).extend([
        new MouseWheelZoom({
          duration: mouseWheelZoomAnimationTime,
        })]),
      target: mapRef.current,
      layers: [],
      view: new ol.View({
        center: mapExtent.center,
        resolution: mapExtent.resolution,
        rotation: mapExtent.rotation,
        projection: projection
      })
    })
    map.on('moveend', sendUpdateExtentAction)
    return map
  }, [mapRef])

  const sendUpdateExtentAction = (evt: any) => {
    const map = evt.map;
    const center = map.getView().getCenter()
    const resolution = map.getView().getResolution()
    const rotation = map.getView().getRotation()
    const payload = {
      center: center,
      resolution: resolution,
      rotation: rotation,
    }
    dispatch(updateMapExtent(payload))
  }

  React.useEffect(() => {
    setMap(initializeOL())
  }, [])

  // This function will resize map when page is manually resize
  window.onresize = () => {
    setTimeout(function () { map.updateSize(); }, 1000);
  }

  // This function should resize map when sidebar is opened or closed
  React.useEffect(() => {
    setTimeout(function () { map?.updateSize(); }, 400);
  }, [sidebarIsOpen])

  React.useEffect(() => {
    if (!map) return;

    if (!map.getView().getInteracting()) {
      map.getView().setCenter(mapExtent.center)
      map.getView().setResolution(mapExtent.resolution)
      map.getView().setRotation(mapExtent.rotation)
    }
  }, [mapExtent])

  React.useEffect(() => {

    const colors = [{ colorStr: 'R', color: RED }, { colorStr: 'G', color: GREEN }, { colorStr: 'B', color: BLUE }];

    function getVisualisation(band: string) {
      let visualisationParameters = datasetCatalog?.summaries?.visualisation_parameters?.bands?.find((b: any) => b.band === band);
      if (!visualisationParameters) {
        visualisationParameters = {
          band: band,
          min: 0,
          max: 1
        }
        // Show at least something...
        if (datasetCatalog?.id === 'Tuulituhoriski') {
          visualisationParameters.min = 5
          visualisationParameters.max = 25
        }
      }
      return visualisationParameters;
    }

    const sources = items.map(item => {
      return colors
        .filter(c => channelSettings[c.colorStr])
        .filter(c => item && item.assets && item.assets[channelSettings[c.colorStr]])
        .map(c => {
          const vis = getVisualisation(channelSettings[c.colorStr]);
          return {
            url: item.assets[channelSettings[c.colorStr]].href,
            color: c.color,
            min: vis.min,
            max: vis.max
          }
        });
    }).filter(s => s.length > 0);
     
    if (JSON.stringify(layerConfig.sources) !== JSON.stringify(sources)) {
      setLayerConfig({sources: sources})
    }

  }, [items, datasetCatalog, channelSettings])

  React.useEffect(() => {
    if (!map) return;

    // Remove previous layers
    const previousLayers = [] as Layer<any>[]
    map.getLayers().forEach((l : Layer<any>) => previousLayers.push(l))
    map.getLayers().clear();
    previousLayers.forEach(l => l.dispose())

    // adds bands together for a single color value
    function sumBands(sources: { url: string, color: number }[], targetColor: number) {
      return sources.reduce((memo, source, i) => {
        if (source.color !== targetColor) { return memo; }
        const item = ['band', i + 1]
        if (memo === 0) {
          memo = item;
        } else {
          memo = ['+', memo, item]
        }
        return memo;
      }, 0 as any)
    }

    const layers = layerConfig.sources.map(sources => {
      return new TileLayer({
        style: {
          color:
            ['color',
              ['*', 255, ['clamp', sumBands(sources, RED), 0, 1]],
              ['*', 255, ['clamp', sumBands(sources, GREEN), 0, 1]],
              ['*', 255, ['clamp', sumBands(sources, BLUE), 0, 1]],
              ['band', sources.length+1] // sources.lenth
            ]
        },
        source: new GeoTIFF({
          transition: 0,
          sources:
            sources.map((s : any) => {
              return {
                url: s.url,
                nodata: 0,
                bands: [1],
                min: s.min,
                max: s.max
              }
            }),
          opaque: false
        })
      })
    })
    map.getLayers().extend(layers)

  }, [map, layerConfig]);

  React.useEffect(() => {
    // Anything in here is fired on component mount.
    return () => {
        // Anything in here is fired on component unmount.
        console.log('OL unmount!');
        const oldLayers = map?.getLayers() || [];
        oldLayers.forEach((l: any) => { l.getSource().clear(); l.setSource(undefined); map?.removeLayer(l) })
        map?.setTarget(null)
    }
  }, [])

  const classes = useStyles()
  return (
    <div ref={mapRef as any} className={classes.mapContainer}>
      <div className={classes.crossHair} />
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    mapContainer: {
      heigh: '100%',
      width: '100%',
      border: 'solid black 1px',
      background: 'black'
    },
    crossHair: {
      pointerEvents: 'none',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundImage: 'url("crosshair.svg")',
      backgroundSize: '80% 80%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      margin: 0,
      padding: 0,
      zIndex: 100,
      position: 'absolute'
    }
  }))

export default OpenLayersMap
