import React, { Component } from 'react';

import DatasetCatalogue from './DatasetCatalogue';

import * as _ from 'lodash';

export default class RootCatalogue extends Component {
    constructor(props) {
        super(props);
        this.state = {
            catalog: {},
            datasets: [],
            selectedDataset: null
        };
    }

    componentDidMount() {
      fetch('/catalog/root.json')
          .then(response => response.json())
          .then((catalog) => {
              var datasets = _.map(_.filter(catalog.links, l => l.rel === 'child'), l => l.href);
              this.setState({ catalog, datasets });
          });
    }

    selectDataset(selectedDataset) {
        this.setState({ selectedDataset });
    }

    render() {
        return (
            <div>
                <h1>Choose your dataset</h1>
                {this.state.datasets.map((dataset, index) => (
                    <button key={index} onClick={() => this.selectDataset(dataset)}>{dataset}</button>
                ))}
                <DatasetCatalogue dataset={this.state.selectedDataset} />
            </div>
        );
    }
}