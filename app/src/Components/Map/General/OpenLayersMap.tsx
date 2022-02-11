import * as React from 'react'
import { createStyles, makeStyles } from '@material-ui/styles'
import { useDispatch, useSelector } from 'react-redux'
import { updateMapExtent, updateSpyglassPosition } from '../../../Store/Actions/data'
import { Layer } from 'ol/layer';
import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import Projection from 'ol/proj/Projection';
import * as ol from 'ol';
import { MouseWheelZoom, defaults } from 'ol/interaction';
import {getRenderPixel} from 'ol/render';
import 'ol/ol.css'
import RenderEvent from 'ol/render/Event';
import SpyGlassBorderCanvas from './SpyGlassBorderCanvas'


const RED = 0;
const GREEN = 1;
const BLUE = 2;

const projection = new Projection({
  code: 'EPSG:3067',
  extent: [50199.4814, 6582464.0358, 761274.6247, 7799839.8902],
});

const mouseWheelZoomAnimationTime = 75;

const spyGlassSize = 100;

interface Props {
  items: any[],
  comparisonItems: any[],
  datasetCatalog: any,
  channelSettings: any
}

const OpenLayersMap: React.FC<Props> = ({ items, comparisonItems, datasetCatalog, channelSettings }) => {
  const mapExtent = useSelector((state: any) => state.dataReducer.data.global.mapExtent)
  const sidebarIsOpen = useSelector((state: any) => state.dataReducer.data.global.sidebarIsOpen)
  const spyGlass = useSelector((state: any) => state.dataReducer.transient.spyGlass)
  const mySpyGlassRef = React.useRef(spyGlass)
  const dispatch = useDispatch()

  const [borderRect, setBorderRect] = React.useState<number[] | null>(null)
  const [map, setMap] = React.useState<any>()
  const [layerConfig, setLayerConfig] = React.useState({ sources: [] as any[], comparisonSources: [] as any[] })

  const spyglassPreRender = (event : RenderEvent) => {
    const mousePosition = mySpyGlassRef.current.position
    if (!event.context) return;

    const ctx : CanvasRenderingContext2D | WebGLRenderingContext = event.context;
    if (ctx instanceof CanvasRenderingContext2D) {
      console.log('CanvasRenderingContext2D => dunno what to do!')
    }
    if (ctx instanceof WebGLRenderingContext) {
      
      let x1,y1,w,h;

      if (mousePosition === null || mousePosition === undefined) {
        x1 = y1 = w = h = 0
      } else {
        const pixel = getRenderPixel(event, mousePosition);

        x1 = pixel[0]-spyGlassSize/2;
        y1 = pixel[1]-spyGlassSize/2;
        w = spyGlassSize;
        h = spyGlassSize;
      }

      ctx.enable(ctx.SCISSOR_TEST);
      ctx.scissor(x1, y1, w, h);
    }
  }

  const spyglassPostRender = (event : RenderEvent) => {
    const mousePosition = mySpyGlassRef.current.position
    if (!event.context) return;

    const ctx : CanvasRenderingContext2D | WebGLRenderingContext = event.context;
    if (ctx instanceof CanvasRenderingContext2D) {
      console.log(' - Post canvas ?!?!?')
    }
    if (ctx instanceof WebGLRenderingContext) {
      ctx.disable(ctx.SCISSOR_TEST);
    }
  }

  const mapRef = React.useRef<HTMLElement>()

  React.useEffect(() => {
    if (!mapRef || !mapRef.current) return;

    const current = mapRef.current

    console.log('Creating a map')
    const map = new ol.Map({
      interactions: defaults({ mouseWheelZoom: false }).extend([
        new MouseWheelZoom({
          duration: mouseWheelZoomAnimationTime,
        })]),
      target: current,
      layers: [],
      view: new ol.View({
        center: mapExtent.center,
        resolution: mapExtent.resolution,
        rotation: mapExtent.rotation,
        projection: projection
      })
    })
    map.on('moveend', sendUpdateExtentAction)

    function onMouseMove(event : any) {
      const position = map.getEventPixel(event)
      dispatch(updateSpyglassPosition({position}))
    }

    function onMouseOut() {
      dispatch(updateSpyglassPosition({position: null}))
    }

    current.addEventListener('mousemove', onMouseMove)
    current.addEventListener('mouseout', onMouseOut)

    setMap(map)

    return function cleanup() {
      console.log('Removing a map')
      map.dispose()
      setMap(null);
      
      current.removeEventListener('mousemove', onMouseMove)
      current.removeEventListener('mouseout', onMouseOut)
    }
  }, [mapRef]);

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

    const itemToSources = (item : any) => {
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
    }

    const newLayerConfig = {
      sources: items.map(itemToSources).filter(s => s.length > 0),
      comparisonSources: comparisonItems.map(itemToSources).filter(s => s.length > 0)
    }
    if (JSON.stringify(newLayerConfig) !== JSON.stringify(layerConfig)) {
      setLayerConfig(newLayerConfig)
    }

  }, [items, comparisonItems, datasetCatalog, channelSettings])

  React.useEffect(() => {
    mySpyGlassRef.current = spyGlass
    
    let borderRect = null
    if (spyGlass.position && layerConfig.comparisonSources.length > 0) {
      borderRect = [spyGlass.position[0]- spyGlassSize / 2, spyGlass.position[1] - spyGlassSize / 2, spyGlassSize, spyGlassSize]
    }
    setBorderRect(borderRect)
    
    map?.render()
  }, [spyGlass, layerConfig.comparisonSources]);

  React.useEffect(() => {
    if (!map) return;

    console.log('Modifying layers:')
    // Remove previous layers
    const previousLayers = [] as Layer<any>[]
    map.getLayers().forEach((l : Layer<any>) => previousLayers.push(l))
    map.getLayers().clear();
    previousLayers.forEach(l => l.dispose())
    console.log(' - removed '+previousLayers.length+' layers')
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

    const sourcesToLayer = (sources : any) => {
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
    }

    const layers = layerConfig.sources.map(sourcesToLayer)
    const comparisonLayers = layerConfig.comparisonSources.map(sourcesToLayer)

    comparisonLayers.forEach(layer => {
      layer.on('prerender', spyglassPreRender)
      layer.on('postrender', spyglassPostRender)
    })
        
    map.getLayers().extend([...layers, ...comparisonLayers])

  }, [map, layerConfig]);

  const classes = useStyles()
  return (
    <div ref={mapRef as any} className={classes.mapContainer}>
      <SpyGlassBorderCanvas borderRect={borderRect} />
      <div className={classes.crossHair}>
        <div className={classes.flexOne}>
          <div className={classes.flexOneInner}></div>
        </div>
        <div className={classes.flexTwo}>
          <div className={classes.flexTwoInner}></div>
          <div className={classes.flexTwoInner} style={{
            borderTop: '1px solid white',
            borderLeft: '1px solid white',
          }}></div>
        </div>
      </div>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    mapContainer: {
      height: '100%',
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
      position: 'absolute',
      display: 'flex',
      flexDirection: 'row'
    },
    crossHairInner: {
      position: 'relative',
      height:'100%', 
      width: '100%',
      zIndex: 101,
      display: 'flex',
      flexDirection: 'row',
      border: 'none'
    },
    flexOne: {
      backgroundColor: 'inherit',
      width: '50%',
    },
    flexOneInner: {

    },
    flexTwo: {
      backgroundColor: 'inherit',
      width: '50%',
      display: 'flex',
      flexDirection: 'column',
    },
    flexTwoInner: {
      width: '100%',
      height: '100%',
    }
  }))

export default OpenLayersMap
