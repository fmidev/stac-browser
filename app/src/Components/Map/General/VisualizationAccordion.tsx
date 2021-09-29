import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { useDispatch, useSelector, batch } from 'react-redux'
import { RootState } from '../../../App'
import { setRedChannel, setGreenChannel, setBlueChannel } from '../../../Store/Actions/data'
import { Grid } from '@material-ui/core'
import ChannelColorTile from '../Visualization/ChannelColorTile'
import BandList from '../ListComponents/Lists/BandList'
import { getBandsForDataset } from '../../../API/Api'
import { setBands } from '../../../Store/Actions/data'

interface Props {
  mapComponentIndex: number
  isExpanded: boolean
}

const VisualizationAccordion: React.FC<Props> = ({ isExpanded, mapComponentIndex }) => {
  const dispatch = useDispatch()
  const channelSettings = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].channelSettings)
  const selectedDataset = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].selectedDataset)
  const clickedColorTile = useSelector((state: RootState) => state.dataReducer.data.global.clickedColorTile)
  const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  // const [clickedColorTile, setClickedColorTile] = React.useState('')
  const [expanded, setExpanded] = React.useState<string | boolean>(isExpanded);

  const handleChange = (panel: string) => (event: React.ChangeEvent<Record<string, unknown>>, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  // Stores and gives access to previous state
  const usePrevious = (value: any) => {
    const ref = React.useRef()
    React.useEffect(() => {
      ref.current = value
    })
    return ref.current
  }

  const previousBands = usePrevious(bands)

  // Check if values in color bubbles are the same as in current bands, if not -> clear bands
  React.useEffect(() => {
    // This is needed for initial run
    if (previousBands === undefined) return

    Object.keys(channelSettings).forEach((key) => {
      if (!bands.find((object: any) => object.name === channelSettings[key])) {
        batch(() => {
          dispatch(setRedChannel({ mapComponentIndex: mapComponentIndex, redChannelValue: '' }))
          dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: '' }))
          dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: '' }))
        })
      }
    })
  }, [bands])

  // Function will set all bands selected automagically, when one of the described datasets is selected
  React.useEffect(() => {
    const specialDatasets = [{
      name: 'Latvuskorkeusmalli',
      value: 'latvuskorkeusmalli'
    }, {
      name: 'Myrskytuhoriskikartta',
      value: 'myrskytuhoriski'
    }, {
      name: 'Tuulituhoriski',
      value: 'tuulituhoriski'
    }]

    specialDatasets.forEach(({ name, value }) => {
      if (name === selectedDataset) {
        batch(() => {
          dispatch(setRedChannel({ mapComponentIndex: mapComponentIndex, redChannelValue: value }))
          dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: value }))
          dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: value }))
        })
      }
    })
  }, [selectedDataset])



  // const setClicked = (value: string) => {
  //   setClickedColorTile(value)
  // }

  const switchListColor = (clickedColorTile: string) => {
    switch (clickedColorTile) {
      case 'R': {
        return (
          <Grid item xs={12} >
            <BandList
              bands={bands}
              color={'red'}
              mapComponentIndex={mapComponentIndex} />
          </Grid>
        )
      }
      case 'G': {
        return (
          <Grid item xs={12} >
            <BandList
              bands={bands}
              color={'green'}
              mapComponentIndex={mapComponentIndex} />
          </Grid>
        )
      }
      case 'B': {
        return (
          <Grid item xs={12} >
            <BandList
              bands={bands}
              color={'blue'}
              mapComponentIndex={mapComponentIndex} />
          </Grid>
        )
      }
      default: {
        return (
          <Grid item xs={12} >
            <BandList
              bands={bands}
              color={'red'}
              mapComponentIndex={mapComponentIndex} />
          </Grid>
        )
      }
    }
  }

  return (
    <div>
      <Accordion square expanded={expanded === 'panel1' || expanded === true} onChange={handleChange('panel1')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1d-content" id="panel1d-header" style={{ height: '85px' }}>
          <Grid container direction='column'>
            <Grid container item direction='row' justify='space-evenly'>
              <Grid item xs={3}>
                <ChannelColorTile text={channelSettings.R} letter={'R'} color={'red'} />
              </Grid>
              <Grid item xs={3}>
                <ChannelColorTile text={channelSettings.G} letter={'G'} color={'rgb(70,198,25)'} />
              </Grid>
              <Grid item xs={3}>
                <ChannelColorTile text={channelSettings.B} letter={'B'} color={'rgb(0,143,225)'} />
              </Grid>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          {switchListColor(clickedColorTile)}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

const Accordion = withStyles({
  root: {
    boxSizing: 'border-box',
    border: '1px solid rgba(0, 0, 0, .125)',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: 'auto',
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    borderBottom: '1px solid rgba(0, 0, 0, .125)',
    marginBottom: -1,
    minHeight: 15,
    '&$expanded': {
      minHeight: 15,
    },
  },
  content: {
    '&$expanded': {
      width: '100%',
      margin: '12px 0',
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    width: '100%',
    padding: theme.spacing(0),
  },
}))(MuiAccordionDetails);

export default VisualizationAccordion