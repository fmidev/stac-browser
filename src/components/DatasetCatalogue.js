import React, { Component } from 'react';

//import * as _ from 'lodash';

export default class DatasetCatalogue extends Component {
    constructor(props) {
        super(props);
        this.state = {
            catalogs: [],
        };
        this.downloadDataset(props.dataset)
    }

    componentDidUpdate(prevProps) {
      if (prevProps.dataset !== this.props.dataset) {
        this.downloadDataset(this.props.dataset)
      }
    }


    async downloadDataset(url) {
      if (url === null || url === undefined) {
        return;
      }

      /*url = url.substr('http://fmi.stac.fi'.length)

      var tmp = await fetch(url);
      tmp = await tmp.json();

      console.log('tmp', tmp);*/
    }

    render() {
        return (
            <div>
                <h2>Dataset {this.props.dataset}</h2>
            </div>
        );
    }
}