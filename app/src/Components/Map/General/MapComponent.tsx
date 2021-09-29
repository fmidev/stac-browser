import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dataset } from '../../../types'
import { RootState } from '../../../App'
import { createStyles, makeStyles } from '@material-ui/styles'
import { Grid, Button } from '@material-ui/core'
import SlimAccordion from './SlimAccordion'
import OpenLayersMap from './OpenLayersMap'
import { Map } from '../../../types'
import { removeMap } from '../../../Store/Actions/data'
import DatasetList from '../ListComponents/Lists/DatasetList'
import NormalVisualization from '../Visualization/NormalVisualization'
import { getAllDatasets, getItemsForDatasetAndTime } from '../../../API/Api'
import VisualizationAccordion from './VisualizationAccordion'

interface Props {
  mapObject: Map,
  mapComponentIndex: number
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
  const selectedDataset = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].selectedDataset)
  const editedDate = new Date(inspectionDate).toISOString().split("T")[0]
  const classes = useStyles()
  const dispatch = useDispatch()
  const [itemObject, setItemObject] = React.useState({ items: [] } as { items: any });
  const [allDatasets, setAllDatasets] = React.useState([] as any[]);

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

  const itemsTemporalInterval = calculateItemsTemporalInterval(itemObject)

  let catalogTemporalInterval = '';
  if (datasetCatalog?.extent?.temporal?.interval) {
    const interval = datasetCatalog?.extent?.temporal?.interval
    catalogTemporalInterval = `(${interval[0].substring(0, 10)} - ${interval[1].substring(0, 10)})`
  }

  return (
    <div className={classes.mapContainer} id='MapContainer'>
      <div className={classes.mapBox}>
        <Button
          style={{ position: 'absolute', zIndex: 2, maxWidth: '35px', minWidth: '35px', maxHeight: '35px', minHeight: '35px', right: '0px' }}
          variant="contained"
          color="secondary"
          onClick={() => dispatch(removeMap({ id: mapObject.id }))}
        >
          -
        </Button>
        <div
          style={{ position: 'absolute', zIndex: 2, left: '0px', bottom: '0px', padding: '0.5em', color: '#ffffffaa', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px black)' }}
        >
          {itemsTemporalInterval}
        </div>
        <OpenLayersMap datasetCatalog={datasetCatalog} items={itemObject.items} channelSettings={mapObject.channelSettings} />
      </div>
      <div className={classes.menuContainer}>
        <div className={classes.dropDown}>
          <SlimAccordion name={datasetCatalog ? datasetCatalog.title : '-'} date={itemsTemporalInterval} temporalInterval={catalogTemporalInterval} isExpanded={false}>
            <DatasetList datasets={allDatasets} mapComponentIndex={mapComponentIndex} />
          </SlimAccordion>
        </div>
        <div className={classes.dropDown}>
          <VisualizationAccordion
            isExpanded={false}
            mapComponentIndex={mapComponentIndex}
          />
        </div>
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
      aspectRatio: '11/10',
    },
    mapBox: {
      display: 'flex',
      border: 'solid black 1px',
      height: '75%',
      width: '100%',
      position: 'relative',
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
    menuContainer: {
      display: 'flex',
      height: '10%',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropDown: {
      width: '100%',
      height: '100%',
      zIndex: 10,
    },
  }))

export default MapComponent