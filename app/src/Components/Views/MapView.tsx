import * as React from 'react'
import { useDispatch } from 'react-redux'
import { addMap } from '../../Store/Actions/data'
import { Dataset } from '../../types'
import { RootState } from '../../App'
import { createStyles, makeStyles, ThemeProvider } from '@material-ui/core/styles'
import { Button, Grid } from '@material-ui/core'
import { useSelector } from 'react-redux'
import MapComponent from '../Map/General/MapComponent'
import { greenTheme } from '../../Theme/theme'

function createMapId() {
  return Math.random().toString(36).substr(2, 9);
}

const MapView: React.FC = () => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const mapData = useSelector((state: RootState) => state.dataReducer.data.maps)

  const payload = {
    "mapObject": {
      "id": createMapId(),
      "selectedDataset": null,
      "channelSettings": {
        "R": null,
        "G": null,
        "B": null
      },
      "displayWindDamageVector": true,
      "displaySpyglass": false,
      "panelBarSettings": {
        "displayDataSourceList": false,
        "displayVisualization": false
      },
      "derivedData": {
        "sources": [],
        "timeValues": {
          "inspection": "",
          "comparison": ""
        },
        "mapLayers": [[]]
      }
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes.buttonContainer} style={{ zIndex: 1000 }}>
        <ThemeProvider theme={greenTheme}>
          <Button
            variant="contained"
            color="primary"
            size='large'
            style={{ color: 'white', fontWeight: 'bold', fontSize: '27px', aspectRatio: '1:1', borderRadius: '50px' }}
            onClick={() => dispatch(addMap(payload))}
          >
            +
          </Button>
        </ThemeProvider>
      </div>
      <Grid container justify='flex-start' spacing={6} >
        {mapData.map((mapObject, index) => {
          return (
            <Grid key={mapObject.id} container direction='column' item xs={12} md={12} lg={6} xl={4} alignItems='center' >
              <MapComponent
                mapObject={mapObject}
                mapComponentIndex={index}
              />
            </Grid>)
        })}
      </Grid>
      <div style={{ width: '55px' }} />
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      display: 'flex',
      padding: '50px',
    },
    buttonContainer: {
      position: 'fixed',
      right: '0',
      bottom: '0',
      padding: '20px',
    },
  }))

export default MapView

