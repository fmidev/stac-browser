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
  sixMonths?: React.MouseEventHandler
}

//GraphView component start
const Dygraphed: React.FC<Props> = ({graphData, children}: Props) => {
  const inspectionDate = useSelector((state: RootState) => state.dataReducer.data.global.inspectionDate)
  const comparisonDate = useSelector((state: RootState) => state.dataReducer.data.global.comparisonDate)
  const sidebarIsOpen = useSelector((state: any) => state.dataReducer.data.global.sidebarIsOpen)
  const graphRef = React.useRef<HTMLDivElement>(null)

  //const bands = useSelector((state: RootState) => state.dataReducer.data.maps[mapComponentIndex].derivedData.bands)
  //const [bands, setBands] = React.useState([] as [])

  const dispatch = useDispatch()
  const classes = useStyles()

  function legendFormatter(this: any, data: any) {
    if (data.x == null) {
      return '<br>' + data.series.map(function(series: { dashHTML: string; labelHTML: string; }) { 
        return series.dashHTML + ' ' + series.labelHTML }).join();
    }
    let html = "<b>" + data.xHTML + "</b>"      
    data.series.forEach(function(series: any) {
    if (!series.isVisible) return;
    let labeledData = series.labelHTML + `: <b>` + series.yHTML + "</b>";
    if (series.isHighlighted) {
      labeledData = "<b>" +  labeledData + "</b>";
    }
    html +=
    "<div class='dygraph-legend-row'>" +
    series.dashHTML + 
    "<div>" + 
    labeledData + 
    "</div></div>";
  });
    return html;
  }

  function pointClicked(e: any, point: any){
    dispatch(setComparisonDate({comparisonDate: point.xval}))
  }

  const graphInit = () => {
    const annotation: any = [{
      series: '',
      x: new Date(inspectionDate).getTime(),
      shortText: 'I',
      text: 'Valkoinen',
      cssClass: 'annotation',
      tickHeight: 138,
      attachAtBottom: true,
    }];
  
    let graph_initialized = false;
    if (!graphRef.current) throw Error("graphRef is not assigned");
    const graph = new Dygraph(graphRef.current,
      graphData.data, 
    {
    width: 500,
    legend: "follow",
    highlightCircleSize: 5,
    colors: [...graphData.colors, '#000111'],
    animatedZooms: true,
    visibility: [true, true, true, true],
    labels: ['Date', ...graphData.labels, ''],
    series: graphData.labels.reduce((memo : any, label) => { memo[label] = { axis: 'y1'}; return memo; }, { '': { axis: 'y2' }}),
    clickCallback: function(e: any, x: any, points: any){
      console.log(points[0].xval)
      dispatch(setComparisonDate({comparisonDate: x}))
    },
    // pointClickCallback: pointClicked,
    legendFormatter: legendFormatter,
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
    drawCallback: function(drawGraph, is_initial) {
      if(is_initial) {
        graph_initialized = true;
        if(annotation.length > 0) {
          drawGraph.setAnnotations(annotation)
        }
      }
      }
    })
    return graph;
  }

  React.useEffect(() => {
    console.log('UseEffect 1')
    if (!graphData.data || graphData.data.length === 0) return;
    //console.log(graphData.data[0])
    const entryAfterInspectionData = graphData.data.find((arr) => arr[0].getTime() > new Date(inspectionDate).getTime())
    //console.log('entryAfterInspectionData', entryAfterInspectionData, inspectionDate)
    const insertIndex = entryAfterInspectionData ? graphData.data.indexOf(new Date(entryAfterInspectionData)) : graphData.data.length
    //console.log(insertIndex)
    graphData.data.splice(insertIndex,0, [new Date(inspectionDate), null, null, null, 1])
    const g = graphInit()
   
 }, [
   inspectionDate,
   graphData,
 ])

 React.useEffect(() => {
  const graph = graphInit()
  const ann = graph.annotations()
    if(comparisonDate ){
      ann.push({
        series: graphData.labels[0],
        x: new Date(comparisonDate).getTime(),
        shortText: 'C',
        text: 'Valkoinen',
        cssClass: 'annotation',
        tickHeight: 150,
        attachAtBottom: true,
      })
    }

  graph.setAnnotations(ann)
  //console.log(graph.annotations())
 }, [
   comparisonDate, 
   graphData,
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
    <div style={{width: '100%', margin: '0rem auto', paddingTop: '0rem'}}>
      <div>{children}</div>
      <Grid ref={graphRef} className={classes.container}>
      </Grid>
    </div>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      height: '100%',
      width: '100%',
      margin: '1rem auto 1rem 0rem'
    },
  }),
)

export default Dygraphed

