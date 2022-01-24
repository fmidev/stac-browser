import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../../App'
import { createStyles, makeStyles } from '@material-ui/styles'
import { Button, styled } from '@material-ui/core'
import SlimAccordion from './SlimAccordion'
import OpenLayersMap from './OpenLayersMap'
import { Map } from '../../../types'
import { removeMap, setGraphState, setGraphTimeSpan } from '../../../Store/Actions/data'
import DatasetList from '../ListComponents/Lists/DatasetList'
// import NormalVisualization from '../Visualization/NormalVisualization'
import { getAllDatasets, getItemsForDatasetAndTime, getTimeseries } from '../../../API/Api'
import VisualizationAccordion from './VisualizationAccordion'
import GraphedView from '../../Views/GraphedView'
import GraphAccordion from './GraphAccordion'

interface Props {
  mapObject: Map,
  mapComponentIndex: number,
}

const Loading = () =>{
  return(
    <div style={{marginTop: '3rem'}}>...Latautuu</div>
  )
}

function calculateItemsTemporalInterval(itemObject : any) {
  let dateStr

  const minMaxDates = itemObject.items.reduce((memo : (null|number)[], item : any) => {
    const dates = [item.properties?.datetime, item.properties?.start_datetime, item.properties?.end_datetime].filter(date => !!date)

    dates.forEach(date => {
      if (memo[0] === null || memo[0] > date) {
        memo[0] = date
      }
      if (memo[1] === null || memo[1] < date) {
        memo[1] = date;
      }
    })
    return memo
  }, [null, null] as (null|number)[])

  if (minMaxDates[0] !== null) {
    const minDay = minMaxDates[0].split("T")[0]
    const maxDay = minMaxDates[1].split("T")[0]
    if (minDay === maxDay) {
      dateStr = `${minDay}`
    } else {
      dateStr = `${minDay} - ${maxDay}`
    }
    if (itemObject.items.length > 1) {
      dateStr += ` (${itemObject.items.length})`
    }
  } else {
    dateStr = 'N/A'
  }
  return dateStr
}

const MapComponent: React.FC<Props> = ({ mapObject, mapComponentIndex }) => {
  const inspectionDate = useSelector((state: RootState): string => state.dataReducer.data.global.inspectionDate)
  const center = useSelector((state: RootState) : number[] => state.dataReducer.data.global.mapExtent.center)
  const resolution = useSelector((state: RootState) : number => state.dataReducer.data.global.mapExtent.resolution)
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.global.comparisonDate)
  const selectedDataset = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].selectedDataset)
  const graphIsOpen = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].graphIsOpen)
  const graphTimeSpan = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].graphTimeSpan)
  const editedDate = new Date(inspectionDate).toISOString().split("T")[0]
  const classes = useStyles()
  const dispatch = useDispatch()
  const [itemObject, setItemObject] = React.useState({ items: [] } as { items: any });
  const [allDatasets, setAllDatasets] = React.useState([] as any[]);
  const [graphData, setGraphData] = React.useState<any>([]);
  const [labels, setLabel] = React.useState([] as string[])

  const showGraph = () => {
    dispatch(setGraphState({graphIsOpen: !graphIsOpen, index: mapComponentIndex}))
  }

  React.useEffect(() => {
    getAllDatasets().then(allDatasets => {
      setAllDatasets(() => {
        return allDatasets;
      })
    })
  }, [])  

  const datasetCatalog = allDatasets.find((c: any) => c.id === selectedDataset) || {}

  // UNCOMMENT THIS TO FETCH MAP ITEMS
  React.useEffect(() => {
    if (inspectionDate && selectedDataset) {
      getItemsForDatasetAndTime(selectedDataset, inspectionDate).then((ret: any) => {
        setItemObject(() => {
          return ret
        })
      })
    }
  }, [selectedDataset, inspectionDate])

  // Graph useEffect
  React.useEffect(() => {
    if(graphIsOpen === true){
      if (!selectedDataset) {
      return 
    }
    //console.log('Load new timeseries for',selectedDataset)
    const bands = ['R','G','B'].map(color => mapObject.channelSettings[color]).filter(band => !!band)
    setLabel(bands)

      const startDate = new Date(inspectionDate)
      const endDate = new Date(inspectionDate)

        startDate.setMonth(startDate.getMonth() - graphTimeSpan / 2)
        endDate.setMonth(endDate.getMonth() + graphTimeSpan / 2)
     /*  startDate.setMonth(startDate.getMonth()-3)
      endDate.setMonth(endDate.getMonth() + 3) */

    console.log(startDate)
    console.log(endDate)
    getTimeseries(selectedDataset, center, resolution, bands, startDate, endDate).then((data) => {
      //console.log('Got timeseries for',selectedDataset, data)
      const d = data.map((d: any) => [d[0], d[1], d[2], d[3], null])
      setGraphData(d)
    })
  }
  }, [
    graphIsOpen, 
    graphTimeSpan, 
    selectedDataset, 
    inspectionDate,
    center, 
    resolution, 
    mapObject.channelSettings
  ])

  const itemsTemporalInterval = calculateItemsTemporalInterval(itemObject)

  let catalogTemporalInterval = '';
  if (datasetCatalog?.extent?.temporal?.interval) {
    const interval = datasetCatalog?.extent?.temporal?.interval
    catalogTemporalInterval = `(${interval[0].substring(0, 10)} - ${interval[1].substring(0, 10)})`
  }

  return (
      <div className={classes.mapContainer} id='MapContainer'>
        <div className={classes.mapBox} style={{border: '1px solid grey',}}>
          <Button
            style={{ 
              position: 'absolute', 
              zIndex: 2, 
              maxWidth: '35px', 
              minWidth: '35px', 
              maxHeight: '35px',
              minHeight: '35px', 
              right: '0px' 
            }}
            variant="contained"
            color="secondary"
            onClick={() => dispatch(removeMap({ id: mapObject.id }))}
          >
            -
          </Button>
          <div
            style={{ 
              position: 'absolute', 
              zIndex: 2, 
              left: '0px', 
              bottom: '0px', 
              padding: '0.5em', 
              color: '#ffffffaa', 
              pointerEvents: 'auto', 
              filter: 'drop-shadow(0px 0px 5px black)'
            }}
          >
            {itemsTemporalInterval}
          </div>
          <OpenLayersMap datasetCatalog={datasetCatalog} items={itemObject.items} channelSettings={mapObject.channelSettings} />
        </div>
        <div className={classes.menuContainer}>
          <div className={classes.dropDown} style={{width: '35%'}}>
            <SlimAccordion name={datasetCatalog ? datasetCatalog.title : '-'} date={itemsTemporalInterval} temporalInterval={catalogTemporalInterval} isExpanded={false}>
              <DatasetList datasets={allDatasets} mapComponentIndex={mapComponentIndex} />
            </SlimAccordion>
          </div>
          <div className={classes.dropDown} style={{width: '35%'}}>
            <VisualizationAccordion isExpanded={false} mapComponentIndex={mapComponentIndex} items={itemObject.items} />
          </div>  
          <div className={classes.dropDown} style={{width: '30%'}}>
            <GraphAccordion 
            name={'Aikasarja'} 
            isExpanded={graphIsOpen} 
            onClick={showGraph}>
            </GraphAccordion>
          </div>
        </div>
        <div style={{width: '100%'}}>
            {graphIsOpen && 
            ((graphData.length === 0 ) ? Loading() : 
            <div className={classes.graphContainer}>
              <div style={{marginTop: '1rem'}}>
                <button onClick={(e: any) => {
                  dispatch(setGraphTimeSpan({graphTimeSpan: 2, index: mapComponentIndex}));
                  console.log(graphTimeSpan)
                }} 
                style={{marginRight: '1rem'}} value="2">
                    <span>2 kk</span>
                </button>
                <button onClick={(e: any) => {
                  dispatch(setGraphTimeSpan({graphTimeSpan: 4, index: mapComponentIndex}))
                  console.log(graphTimeSpan)
                  }} 
                  style={{marginRight: '1rem'}} value="4">
                  <span>4 KK</span>
                </button>
                <button onClick={
                  () => dispatch(setGraphTimeSpan({graphTimeSpan: 6, index: mapComponentIndex}))} 
                  style={{marginRight: '1rem'}}
                  value="6">
                  <span>6 KK</span>
                </button>
              </div>
              <GraphedView data={graphData} label={labels} mapComponentIndex={mapComponentIndex}/>
            </div>)
            }
        </div>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    mapContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      minHeight: '300px',
      flexGrow: 1,
      margin: '0.5rem 0rem',
      padding: '1rem',
      aspectRatio: '11/10',
    },
    mapBox: {
      display: 'flex',
      border: 'solid black 1px',
      minHeight: '75%',
      width: '100%',
      position: 'relative',
    },
    menuContainer: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      display: 'flex',
      height: '15%',
      width: '100%',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      borderBottom: 'solid black 1px',
      borderLeft: 'solid black 1px',
      borderRight: 'solid black 1px'
    },
    dropDown: {
      // width: '33.333%',
      height: '100%',
      zIndex: 1000,
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    graphContainer: {
      position: 'relative', 
      zIndex: 100, 
      backgroundColor: 'white',
      marginTop: '1rem',
      marginBottom: '4rem',
      borderBottom: 'solid 	rgb(211,211,211) 1px',
      width: '100%',
    }
  }))

export default MapComponent