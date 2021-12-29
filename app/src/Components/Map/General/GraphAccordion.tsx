import React, {MouseEvent} from 'react';
import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import {Grid, Typography, } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

interface Props {
  children: React.ReactNode
  name: string,
  temporalInterval?: string,
  isExpanded: boolean,
  onClick:  (e: any) => void,
}

const GraphAccordion: React.FC<Props> = ({name, isExpanded, onClick}) => {

  return (
    <div>
       <Accordion square expanded={isExpanded} onClick={onClick}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1d-content" id="panel1d-header">
          <Typography style={{position: 'relative', fontSize: 'calc(8px + 2 * ((100vw - 320px) / 680))' ,}}>{name}</Typography>
        </AccordionSummary>
        <AccordionDetails>
        </AccordionDetails>
      </Accordion>
    </div>
  )}
  
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
      marginBottom: -1,
      minHeight: 84,
      '&$expanded': {
        minHeight: 85,
      },
    },
    content: {
      '&$expanded': {
        margin: '-12px 0',
        width: '400%'
      },
    },
    expanded: {},
  })(MuiAccordionSummary);
  
  const AccordionDetails = withStyles((theme) => ({
    root: {
      width: '100%',
      padding: theme.spacing(0),
      fontSize: 'calc(8px + 2 * ((100vw - 320px) / 680))' ,

    },
  }))(MuiAccordionDetails);
  
  export default GraphAccordion;