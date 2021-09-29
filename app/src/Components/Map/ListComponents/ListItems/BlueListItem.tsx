import * as React from 'react'
import { useDispatch } from 'react-redux';
import { setBlueChannel } from '../../../../Store/Actions/data'
import { createStyles, makeStyles, withStyles } from '@material-ui/styles'
import { blue } from '@material-ui/core/colors';
import { Radio, RadioProps } from '@material-ui/core'
import { ListChildComponentProps } from 'react-window'
import { isNamedExports } from 'typescript';
import { useSelector } from 'react-redux'
import { RootState } from '../../../../App';
import { setClickedColorTile } from '../../../../Store/Actions/data';

const BlueRadio = withStyles({
  root: {
    color: blue[400],
    '&$checked': {
      color: blue[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const BlueListItem: React.FC<ListChildComponentProps> = ({ data, index, style }) => {
  const name = data.bands[index].name
  const selectedValue = data.selectedValue
  const mapComponentIndex = data.mapComponentIndex
  const classes = useStyles()
  const dispatch = useDispatch()
  const channelSettings = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].channelSettings)

  const changeToNextList = () => {
    const key = Object.keys(channelSettings).find(key => channelSettings[key] === '' && key !== 'B')
    console.log('key in red list item: ', key)
    if (key) {
      dispatch(setClickedColorTile({ clickedColorTile: key }))
    }
  }

  return (
    <div className={classes.listItemContainer} style={style}>
      <BlueRadio
        checked={selectedValue === name}
        onChange={() => {
          changeToNextList()
          if (name === 'poista valinta') dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: '' }))
          else dispatch(setBlueChannel({ mapComponentIndex: mapComponentIndex, blueChannelValue: name }))
        }}
        value={isNamedExports}
      />
      {name}
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

export default BlueListItem