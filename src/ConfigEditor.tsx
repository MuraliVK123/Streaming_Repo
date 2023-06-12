import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from './types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> { }

interface State { }

export class ConfigEditor extends PureComponent<Props, State> {

   constructor(instanceSettings: Props) {
    super(instanceSettings);
    this.onLoadURL();
  }

  onURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onLoadURL = () => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: "host/api/realtime/",
    };
    onOptionsChange({ ...options, jsonData });
  };


  render() {
    const { options } = this.props;
    const { jsonData } = options;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="HOST ADDRESS"
            labelWidth={15}
            inputWidth={20}
            onChange={this.onURLChange}
            value={jsonData.url || 'host/api/realtime/'}
          /></div>
        
      </div>
    );
  }
}
