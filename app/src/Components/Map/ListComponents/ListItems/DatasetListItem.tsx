import * as React from 'react'
import { useDispatch, batch } from 'react-redux';
import { createStyles, makeStyles, withStyles } from '@material-ui/styles'
import { green } from '@material-ui/core/colors';
import { Radio, RadioProps } from '@material-ui/core'
import { ListChildComponentProps } from 'react-window'
import { setSelectedDataset, setBands } from '../../../../Store/Actions/data'
import { getBandsForDataset } from '../../../../API/Api';

const GreenRadio = withStyles({
  root: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const DatasetListItem: React.FC<ListChildComponentProps> = ({ data, index, style }) => {
  const selectedDataset = data.selectedDataset
  const datasetId = data.datasets[index].id
  const datasetTitle = data.datasets[index].title
  const mapComponentIndex = data.mapComponentIndex
  const classes = useStyles()
  const dispatch = useDispatch()

  React.useEffect(() => {
    if (selectedDataset !== null && selectedDataset !== undefined) {
      getBandsForDataset(selectedDataset).then((bands) => {
        dispatch(setBands({ bands: bands, mapComponentIndex: mapComponentIndex }))
      })
    }
  }, [selectedDataset, mapComponentIndex])

  return (
    <div className={classes.listItemContainer} style={style}>
      <GreenRadio
        checked={selectedDataset === datasetId}
        onChange={() => {
          batch(() => {
            dispatch(setSelectedDataset({ mapComponentIndex: mapComponentIndex, selectedDataset: datasetId }))
          })
        }}
        value={datasetId}
      />
      {datasetTitle}
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    listItemContainer: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      fontSize: '0.6rem',
    }
  }))

export default DatasetListItem