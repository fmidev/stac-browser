import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core';
import { setComparisonDate } from '../../Store/Actions/data'

interface Props {
  graphData: {
    data: any[],
    labels: string[],
    colors: string[]
  },
  children: JSX.Element,
  twoMonths?:  React.MouseEventHandler,
  fourMonths?: React.MouseEventHandler,
  sixMonths?: React.MouseEventHandler,
  mapComponentIndex: number
}
const Graph: React.FC<Props> = ({graphData, children, mapComponentIndex}: Props) => {
  const inspectionDate = useSelector((state: RootState): string => state.dataReducer.data.global.inspectionDate)
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.global.comparisonDate)
  const sidebarIsOpen = useSelector((state: any) => state.dataReducer.data.global.sidebarIsOpen)
  const graphRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useDispatch()

  function clickedCallBack(e: any, x: any, points: any){
    dispatch(setComparisonDate({comparisonDate: x}))
  }

  function pointClicked(e: any, point: any){
    dispatch(setComparisonDate({comparisonDate: point.xval}))
  }

  function ensureAnnotationDate (graphArray: any [], time: any) { 
    const graphDataTime = graphArray.find((arr: any) => arr[0] === new Date(time).getTime())
    if(graphDataTime) return;
    
    const entryData= graphArray.find((arr: any) => arr[0].getTime() > new Date(time).getTime())
    const insertIndex = entryData ? graphArray.indexOf(entryData) : graphArray.length;

    graphArray.splice(insertIndex,0, [new Date(time), null, null, null])
    console.log('Insert time: ', time, 'At index: ', insertIndex)
    /* console.log(insertIndex, entryData)
      if(insertIndex < 0) return;
      graphArray.splice(insertIndex,0, [new Date(time), null, null, null, 1]) */
  }

  const graphInit = () => {
    
    if (!graphRef.current) throw Error("graphRef is not assigned");
    const g = new Dygraph(graphRef.current,
      graphData.data, 
    {
    legend: "always",
    highlightCircleSize: 5,
    colors: [...graphData.colors],
    animatedZooms: true,
    visibility: [true, true, true],
    labels: ['Date', ...graphData.labels],
    series: graphData.labels.reduce((memo : any, label) => { memo[label] = { axis: 'y1'}; return memo; }, {}),
    connectSeparatedPoints: true,
    clickCallback: clickedCallBack,
    pointClickCallback: pointClicked,
    //legendFormatter: legendFormatter,
    axes: {
      x:{
        axisLabelFormatter: (ms) => new Date(ms).toISOString().substr(0,7),
        valueFormatter: (ms) => new Date(ms).toISOString(),
        axisLineColor: "rgb(229, 228, 256)",
        drawGrid: false,
      },
      y: {
        axisLineColor: "rgb(229, 228, 226)",
        drawGrid: false,
      },
      y2: {
        axisLineColor: "rgb(229, 228, 226)",
      }
    },
    })
    return g;
  }

  React.useEffect(() => {
    ensureAnnotationDate(graphData.data, inspectionDate)
    if(comparisonDate){
      ensureAnnotationDate(graphData.data, comparisonDate)
    }

    const g = graphInit()
    const annotationInit = [{
      series: '',
      x: new Date(inspectionDate).getTime(),
      shortText: 'I',
      text: 'Valkoinen',
      cssClass: 'annotation',
      tickHeight: 138,
      attachAtBottom: true,
    }
    ]
    console.log('InspectionDate -:', annotationInit)
    if(comparisonDate){
      annotationInit.push(
        { 
          series: graphData.labels[0],
          x: new Date(comparisonDate).getTime(),
          shortText: '',
          text: 'Valkoinen',
          cssClass: 'annotation',
          tickHeight: 120,
          attachAtBottom: true,} 
      )
    }
    console.log('comparisonDate -:', annotationInit)
   g.setAnnotations(annotationInit)

   return () => {
    if(g){
      g.destroy()
    }
  } 

  },
  [
    graphData,
    inspectionDate,
    comparisonDate,
])

  // This function should resize map when sidebar is opened or closed
  React.useEffect(() => {
    if(sidebarIsOpen){
      graphInit().resize(500, 280)
    }
    if(!sidebarIsOpen){
      graphInit().resize(550, 300)
    }
  }, [sidebarIsOpen])


 return (
  <div style={{width: '100%', margin: '0rem auto', paddingTop: '0rem', height: '330px'}}>
     <div>{children}</div>
    <Grid ref={graphRef} style={{
      marginTop: '10px',
      height: '90%',
      width: '100%',
      margin: 'auto'}}>
      Graph
    </Grid>
  </div>
  )
}

export default Graph;
