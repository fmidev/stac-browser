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
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].comparisonDate)
  const selectedDataset = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].selectedDataset)
  const graphIsOpen = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].graphIsOpen)
  const graphTimeSpan = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].graphTimeSpan)
  const editedDate = new Date(inspectionDate).toISOString().split("T")[0]
  const classes = useStyles()
  const dispatch = useDispatch()
  const [itemObject, setItemObject] = React.useState({ items: [] } as { items: any });
  const [comparisonItemObject, setComparisonItemObject] = React.useState({ items: [] } as { items: any });
  const [allDatasets, setAllDatasets] = React.useState([] as any[]);

  const [graphData, setGraphData] = React.useState<any>([]);


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
        setItemObject(ret)
      })
    }
  }, [selectedDataset, inspectionDate])

  React.useEffect(() => {
    if (comparisonDate && selectedDataset) {
      getItemsForDatasetAndTime(selectedDataset, comparisonDate).then((ret: any) => {
        setComparisonItemObject(ret)
      })
    }
  }, [selectedDataset, comparisonDate])

  // Graph useEffect
  React.useEffect(() => {
    if(graphIsOpen === true){
      if (!selectedDataset) {
      return 
    }
    const bands = ['R','G','B'].map(color => mapObject.channelSettings[color])

    const startDate = new Date(inspectionDate)
    const endDate = new Date(inspectionDate)

    startDate.setMonth(startDate.getMonth() - graphTimeSpan / 2)
    endDate.setMonth(endDate.getMonth() + graphTimeSpan / 2)
    
    // console.log(new Date(comparisonDate).getTime(), startDate))
   
    if(comparisonDate){
      console.log(startDate > new Date(comparisonDate))
      if(startDate > new Date(comparisonDate) ){
        startDate.setMonth(new Date(comparisonDate).getMonth() - 1 )
        endDate.setMonth(new Date(inspectionDate).getMonth() + 1)
      } if( new Date(comparisonDate) > endDate){
        startDate.setMonth(new Date(inspectionDate).getMonth() - 1 )
        endDate.setMonth(new Date(comparisonDate).getMonth() + 1 )
      }
    }
    getTimeseries(selectedDataset, center, resolution, bands, startDate, endDate).then((data) => {
      //console.log('Got timeseries for',selectedDataset, data)
      const d = data.map((d: any) => [...d, null])
      const bandIds = bands.map((b,i) => b+'-'+['R','G','B'][i])
      console.log('bands', bandIds, 'data', data[0])
      setGraphData({data: d, labels: bandIds, colors: ["#DC143C","#32CD32","#0000FF"]})
    })
  }
  }, [
    graphIsOpen, 
    graphTimeSpan, 
    selectedDataset, 
    inspectionDate,
    center, 
    resolution, 
    mapObject.channelSettings,
    comparisonDate
  ])

  const itemsTemporalInterval = calculateItemsTemporalInterval(itemObject)
  const comparisonItemsTemporalInterval = calculateItemsTemporalInterval(comparisonItemObject)

  const visibleTemporalInterval = itemsTemporalInterval + ' (spy: '+(comparisonItemsTemporalInterval === itemsTemporalInterval ? 'same' : comparisonItemsTemporalInterval)+')'
  

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
              pointerEvents: 'none', 
              filter: 'drop-shadow(0px 0px 5px black)'
            }}
          >
            {visibleTemporalInterval}
          </div>
          <OpenLayersMap datasetCatalog={datasetCatalog} items={itemObject.items} comparisonItems={comparisonItemObject.items} channelSettings={mapObject.channelSettings} />
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
        <div 
            style={{
            width: '100%', 
            position: 'relative', 
            top: '10', 
            }}>
            {graphIsOpen && 
            ((graphData.length === 0 ) ? Loading() : 
            <div className={classes.graphContainer}>
              <GraphedView graphData={graphData} mapComponentIndex={mapComponentIndex} 
              >
                <div style={{marginTop: '1rem'}}>
                  <button 
                    onClick={
                      () => {
                      dispatch(setGraphTimeSpan({graphTimeSpan: 2, index: mapComponentIndex}))
                      /* setActiveFour(false)
                      setActiveSix(false)
                      setActiveTwo(true) */
                      }} 
                    style={{
                      marginRight: '4px',
                      border: 'solid 	rgb(211,211,211) 1px',
                      padding: '4px 8px',
                      fontWeight: 600,
                      }}
                      className={graphTimeSpan === 2 ? classes.buttonBg : undefined}>2 kk
                  </button>
                  <button 
                    onClick={
                      () => {
                      dispatch(setGraphTimeSpan({graphTimeSpan: 4, index: mapComponentIndex}))
                      /* setActiveTwo(false)
                      setActiveSix(false)
                      setActiveFour(true) */
                      }
                    } 
                    style={{
                      marginRight: '4px',
                      border: 'solid rgb(211,211,211) 1px', 
                      padding: '4px 8px',
                      fontWeight: 600,
                    }}
                      className={graphTimeSpan === 4 ? classes.buttonBg : undefined}
                      >4 kk
                  </button>
                  <button 
                    onClick={
                      () => {
                        dispatch(setGraphTimeSpan({graphTimeSpan: 6, index: mapComponentIndex}))
                       /*  setActiveTwo(false)
                        setActiveFour(false)
                        setActiveSix(true) */
                      }
                    } 
                    style={{
                      border: 'solid rgb(211,211,211) 1px',
                      padding: '4px 8px',
                      fontWeight: 600,
                    }}
                      className={graphTimeSpan === 6 ? classes.buttonBg : undefined}>6 kk
                  </button>
                </div> 
              </GraphedView>
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
      top: 0,
      marginTop: 0,
      zIndex: 100, 
      backgroundColor: 'white',
      marginBottom: '4rem',
      border: 'solid 	rgb(211,211,211) 1px',
      width: '100%',
      webkitBoxShadow: 'inset -2px  8px 0px -2px rgba(50, 50, 50, 0.4)',
      mozBoxShadow: 'inset -2px  8px 0px -2px rgba(50, 50, 50, 0.4)',
      boxShadow: 'inset -2px  8px 0px -2px rgba(50, 50, 50, 0.4)',
    },
    buttonBg: {
      backgroundColor: '#558F6E',
      color: 'white', 
      border: '1px solid #558F6E',
    }
  }))

export default MapComponent