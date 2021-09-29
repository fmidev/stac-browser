import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { Grid, Typography, } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

interface Props {
  children: React.ReactNode
  name: string
  date?: string
  temporalInterval?: string
  isExpanded: boolean
}

const SlimAccordion: React.FC<Props> = ({ children, name, date, temporalInterval, isExpanded }) => {
  const [expanded, setExpanded] = React.useState<string | boolean>(isExpanded);

  const handleChange = (panel: string) => (event: React.ChangeEvent<Record<string, unknown>>, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <div>
      <Accordion square expanded={expanded === 'panel1' || expanded === true} onChange={handleChange('panel1')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1d-content" id="panel1d-header" style={{ height: '85px' }}>
          <Grid container direction='column' justify='center'>
            <Grid item>
              <Typography style={{ fontSize: '14px' }}>{name}</Typography>
            </Grid>
            <Grid item>
              <Typography style={{ fontSize: '14px' }}>{temporalInterval}</Typography>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          {children}
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

export default SlimAccordion