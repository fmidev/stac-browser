import * as React from 'react';
import Dygraph from 'dygraphs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../App';
import { createStyles, makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core';
import { setComparisonDate } from '../../Store/Actions/data'

interface GraphData {
  data: any[],
  labels: string[],
  colors: string[]
}

interface Props {
  graphData: GraphData,
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
  const classes = useStyles()

  function clickedCallBack(e: any, x: any, points: any){
    dispatch(setComparisonDate({comparisonDate: x}))
  }

  function pointClicked(e: any, point: any){
    dispatch(setComparisonDate({comparisonDate: point.xval}))
  }

  function ensureAnnotationDate (graphArray: any [], time: any) { 
    const graphDataTime = graphArray.find((arr: any) => arr[0].getTime() === new Date(time).getTime())
    if(graphDataTime) return;
    
    const entryData= graphArray.find((arr: any) => arr[0].getTime() > new Date(time).getTime())
    const insertIndex = entryData ? graphArray.indexOf(entryData) : graphArray.length;

    graphArray.splice(insertIndex,0, [new Date(time), null, null, null])
    console.log('Insert time: ', time, 'At index: ', insertIndex)
  }

  function legendFormatter(this: any, data: any) {
    if (data.x == null) {
      return '<br>' + data.series.map(function(series: { dashHTML: string; labelHTML: string; }) { 
        return series.dashHTML + ' ' + series.labelHTML }).join();
    }
    let html = "<b>" + data.xHTML + "</b>"      
    data.series.forEach(function(series: any) {
    if (!series.isVisible) return;
    let labeledData = series.labelHTML + `: <b>` + series.yHTML + "</b>";
    //console.log(labeledData)
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

  const graphInit = (graphData : GraphData) => {
    
    if (!graphRef.current) throw Error("graphRef is not assigned");
    console.log('new g')
    const g = new Dygraph(graphRef.current,
      graphData.data, 
    {
    width: 490,
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
    })
    return g;
  }

  React.useEffect(() => {
    ensureAnnotationDate(graphData.data, inspectionDate)
    if(comparisonDate){
      ensureAnnotationDate(graphData.data, comparisonDate)
    }

    const g = graphInit(graphData)
    const annotationInit = [{
      series: graphData.labels[0],
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
        shortText: 'C',
        text: 'Valkoinen',
        cssClass: 'annotation',
        tickHeight: 120,
        attachAtBottom: true,
        } 
      )
    }
    console.log('comparisonDate -:', annotationInit)
   g.setAnnotations(annotationInit)

   if(sidebarIsOpen){
    g.resize(400, 200)
  }
  if(!sidebarIsOpen){
    g.resize()
  }

   return () => {
     //console.log('destroy',g)
    if(g){
      g.destroy()
    }
  }
},[
  graphData,
  inspectionDate,
  comparisonDate,
  sidebarIsOpen
])

 return (
  <div className={classes.container}>
    <div>{children}</div>
      <div ref={graphRef} className={classes.graphContainer}></div>
  </div>
  )
}
const useStyles = makeStyles((theme) =>
  createStyles({
      container: {
        width: '100%', 
        margin: '0rem auto', 
        paddingTop: '0rem',
        ['@media screen and (maxwidth: 599px)']:{
          maxWidth: '400px',
          margin: 'auto', 
        },
        ['@media screen and (min-width: 600px)']:{
          maxWidth: '400px',
          margin: 'auto', 
        },
        ['@media screen and (min-width: 900px)']:{
          maxWidth: '500px',
          margin: 'auto'
        },
        ['@media screen and (min-width: 1200px)']:{
          maxWidth: '675px',
        },
      },
      graphContainer: {
        margin: '0rem auto auto -1rem',
        width: '100%',
        ['@media screen and (min-width: 600px)']:{
          maxWidth: '400px',
          margin: 'auto'
        },
        ['@media screen and (min-width: 900px)']:{
          maxWidth: '500px',
          margin: 'auto'
        },
        ['@media screen and (min-width: 1200px)']:{
          width: '500px',
        },
      },
 
  }),
)

export default Graph;

