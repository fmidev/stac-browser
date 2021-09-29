import * as React from 'react'
import { Grid, Card } from '@material-ui/core'
import SelectMonth from '../SidePanel/SelectMonth'
import SelectDay from '../SidePanel/SelectDay'

const SidePanel: React.FC = () => {
  return (
    <div >
      <Grid container direction="column" justify="center" alignItems="center" spacing={2} >
        <Grid item style={{ width: '90%', padding: '10px' }}>
          <SelectMonth />
        </Grid>
        <Grid item style={{ width: '90%' }} >
          <Card style={{ paddingTop: '10px', paddingBottom: '10px' }}>
            <SelectDay />
          </Card>
        </Grid>
      </Grid>
    </div >
  )
}

export default SidePanel
