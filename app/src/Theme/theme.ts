import { createMuiTheme } from '@material-ui/core/styles'
import { grey, green, red, yellow, blue } from '@material-ui/core/colors'

export const customTheme = createMuiTheme({
  palette: {
    primary: {
      main: grey[200],
    },
    secondary: {
      main: red[700]
    },
    error: {
      main: red[700]
    },
    warning: {
      main: yellow[500]
    },
    info: {
      main: blue[500]
    },
    success: {
      main: green[700]
    }
  }
})

export const greenTheme = createMuiTheme({
  palette: {
    primary: {
      main: green[600]
    }
  }
})