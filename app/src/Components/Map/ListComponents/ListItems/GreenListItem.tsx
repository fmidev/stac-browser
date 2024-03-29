import * as React from 'react'
import { useDispatch } from 'react-redux';
import { setGreenChannel } from '../../../../Store/Actions/data'
import { createStyles, makeStyles, withStyles } from '@material-ui/styles'
import { green } from '@material-ui/core/colors';
import { Radio, RadioProps } from '@material-ui/core'
import { ListChildComponentProps } from 'react-window'
import { isNamedExports } from 'typescript';
import { useSelector } from 'react-redux'
import { RootState } from '../../../../App';
import { setClickedColorTile } from '../../../../Store/Actions/data';

const GreenRadio = withStyles({
  root: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const GreenListItem: React.FC<ListChildComponentProps> = ({ data, index, style }) => {
  const name = data.bands[index].name
  const selectedValue = data.selectedValue
  const mapComponentIndex = data.mapComponentIndex
  const classes = useStyles()
  const dispatch = useDispatch()
  const channelSettings = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].channelSettings)


  const listItem = () => {
    if (data.items.length > 0) {
      const linksList = [];
      for (let i=0; i<data.items.length; i++) {
        const links: any = Object.values(data.items[i].assets).find((obj: any) => {
          return obj.title == name
        });
        if (links !== undefined) {linksList[i] = links.href}
      }
      console.debug(linksList)
      if (linksList.length > 0) {
        const linkArray = [
          <div>{name}</div>,
          <div style={{marginLeft: 'auto', marginRight: 0}}>Download</div>,
        ]
        for (let i=1; i<linksList.length; i++) {
          linkArray.push(<a href={linksList[linksList.length-i]} style={{ marginLeft: '5px' }}>{i}</a>);
        }
        linkArray.push(<a href={linksList[0]} style={{ marginLeft: '5px', marginRight: '20px' }}>{linksList.length}</a>);
        return linkArray
      }
      else { return name }
    }
  }

  const changeToNextList = () => {
    const key = Object.keys(channelSettings).find(key => channelSettings[key] === '' && key !== 'G')
    console.log('key in red list item: ', key)
    if (key) {
      dispatch(setClickedColorTile({ clickedColorTile: key }))
    }
  }

  return (
    <div className={classes.listItemContainer} style={style}>
      <GreenRadio
        checked={selectedValue === name}
        onChange={() => {
          changeToNextList()
          if (name === 'poista valinta') dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: '' }))
          else dispatch(setGreenChannel({ mapComponentIndex: mapComponentIndex, greenChannelValue: name }))
        }}
        value={isNamedExports}
      />
      {listItem()}
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

export default GreenListItem