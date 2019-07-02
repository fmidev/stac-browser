import React, { Component } from 'react';

import DatasetCatalogue from './DatasetCatalogue';

import * as _ from 'lodash';

import './RootCatalogue.css';

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
        fetch(this.props.root)
            .then(response => response.json())
            .then((catalog) => {
                var datasets = _.map(_.filter(catalog.links, l => l.rel === 'child'), l => l.href);
                this.setState({ catalog, datasets });
            });
    }

    selectDataset(selectedDataset) {
        if (this.state.selectedDataset === selectedDataset){
            selectedDataset = null;
        }
        this.setState({ selectedDataset });
        this.props.selectCatalogue(selectedDataset);
    }

    render() {
        return (
            <div className="RootCatalogue">
                <h1>Choose your dataset</h1>
                <div className="AvailableDatasets">
                    {this.state.datasets.map((dataset, index) => (
                        <span className={'Dataset'+ (this.state.selectedDataset === dataset ? ' SelectedDataset' : '')} key={index} onClick={() => this.selectDataset(dataset)}>{dataset}</span>
                    ))}
                    <DatasetCatalogue dataset={this.state.selectedDataset} />
                </div>
            </div>
        );
    }
}