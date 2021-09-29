import * as React from 'react'
import { createStyles, makeStyles, withStyles } from '@material-ui/styles'
import { green, red, blue } from '@material-ui/core/colors';
import { Radio, RadioProps } from '@material-ui/core'
import { ListChildComponentProps } from 'react-window'
import { isNamedExports } from 'typescript';

// interface Props {
//   key: string
//   name: string
//   onChange: (value: string) => void
//   selectedValue: string
// }

const GreenRadio = withStyles({
  root: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const RedRadio = withStyles({
  root: {
    color: red[400],
    '&$checked': {
      color: red[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);

const BlueRadio = withStyles({
  root: {
    color: blue[400],
    '&$checked': {
      color: blue[600],
    },
  },
  checked: {},
})((props: RadioProps) => <Radio color="default" {...props} />);



const BandListItem: React.FC<ListChildComponentProps> = ({ data, index, style }) => {
  const name = data.sources[index].name
  const selectedValue = data.selectedValue
  const color = data.color
  const classes = useStyles()

  switch (color) {
    case 'R': {
      return (
        <div className={classes.listItemContainer} style={style}>
          <RedRadio
            checked={selectedValue === name}
            onChange={() => data.onChange(name)}
            value={isNamedExports}
          />
          {name}
        </div>
      )
    }
    case 'G': {
      return (
        <div className={classes.listItemContainer} style={style}>
          <GreenRadio
            checked={selectedValue === name}
            onChange={() => data.onChange(name)}
            value={isNamedExports}
          />
          {name}
        </div>
      )
    }
    case 'B': {
      return (
        <div className={classes.listItemContainer} style={style}>
          <BlueRadio
            checked={selectedValue === name}
            onChange={() => data.onChange(name)}
            value={isNamedExports}
          />
          {name}
        </div>
      )
    }
    default: {
      return (
        <div className={classes.listItemContainer} style={style}>
          <GreenRadio
            checked={selectedValue === name}
            onChange={() => data.onChange(name)}
            value={isNamedExports}
          />
          {name}
        </div>
      )
    }
  }
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

export default BandListItem