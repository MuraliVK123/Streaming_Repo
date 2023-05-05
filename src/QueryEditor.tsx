import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';

import "./QueryEditor.css"

import { Select, Switch } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
//import Dropdown from 'react-bootstrap/Dropdown';
//import DropdownButton from 'react-bootstrap/DropdownButton';


//const { FormField} = LegacyForms;



   const options = [
    "","Log","Live"
   ]

   let signalData: any[] = []

  
   const Options = options.map((option) => (
     <option key={option} value={option}>
       {option}
     </option>
   ));
type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  // onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query } = this.props;
  //   onChange({ ...query, queryText: event.target.value });
  // };
  

  constructor(Props: any) {
    super(Props);
    // let data = this.getSignals("Live");
    // console.log(data);
    // //this.getSignals("Live")
    
  }

 

  async getSignals(type: string){
    signalData = [];
    let logData: any[] = [];
    await fetch("https://10.171.111.43/api/realtime/" + type + "/signals?pattern=*")
    .then(response => response.json())
    .then(data => {
      signalData = [];
      logData = data
      let slicesData: any = logData.slice(0,25);
      slicesData.map((option: any, i: any) => {
        if(i < 25){
          signalData.push({label : option , value : option})
        }else{
          return
        }
      });
    })
    .catch(error => {
      console.error(error)
    });
    
  }

  onServerChange = (event: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, server: event.value});
    if(query.pattern === undefined || query.pattern === ""){
      onChange({ ...query, server: event.value , selectedSignals : [event.value]});
    }
    // let sArray: any[] = [];
    // sArray.push(event.value);
    // query.selectedSignals = sArray;
    // executes the query
    onRunQuery();
  };
  onDisplayNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, IsDisplayName: event.target.checked });
    // executes the query
    onRunQuery();
  };


  
  onDataTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, dataType: event.target.value });
    // executes the query
    query.server = "";
    this.getSignals(event.target.value);
    onRunQuery();
    

  };
  onAliasnameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, aliasName: event.target.value });
    // executes the query
    onRunQuery();

  };
  onScaleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, scale: event.target.value });
    // executes the query
    onRunQuery();

  };
  onPatternChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    //query.pattern = undefined;
    let logData: any[] = [];
    let pattern = ""
    let type = query.dataType === "Log" ? "Log":"Live";
    onChange({ ...query, pattern: event.target.value,selectedSignals:logData });
    if(event.target.value !== ""){
       pattern = "@("+ event.target.value + ")"
    }
    //onRunQuery();
    fetch("https://10.171.111.43/api/realtime/"+ type + "/signals?pattern=" + pattern)
    .then(response => response.json())
    .then(data => {
      logData = data
      if(data.status === "error"){
        onChange({ ...query,selectedSignals:[query.server],pattern:event.target.value });
        onRunQuery();
      }else{
        onChange({ ...query,selectedSignals:logData,pattern:event.target.value });
        onRunQuery();
      }
      
    })
    .catch(error =>{
      onChange({ ...query, pattern: event.target.value,selectedSignals:logData });
      console.error(error)
    });

    

  };

  render() {
    const query = defaults(this.props.query, defaultQuery);

    //const signalArray = signalData 
    
    console.log("signals:" + signalData)
    const { server,dataType,IsDisplayName,aliasName,scale,pattern } = query;
    
    
      return (
        <div className="gf-form-group">
          <div className="gf-form-inline">
          <label className="gf-form-label query-keyword width-10">Select Type</label>
          <select  className="gf-form-label"
               value={dataType} 
               onChange={this.onDataTypeChange} >
           {Options}
           </select>
           <label className="gf-form-label query-keyword width-10">Select Signal</label>
             <Select
                className="gf-form-label width-10"
                isMulti={false}
                isClearable={false}
                backspaceRemovesValue={false}
                onChange={this.onServerChange}
                options={signalData}
                isSearchable={true}
                maxMenuHeight={500}
                placeholder= ""
                value={server}
                noOptionsMessage={'No options found'}></Select>
          </div>
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-10">DisplayNames</label>
            <Switch value = {IsDisplayName} onChange={this.onDisplayNameChange}/> 
          </div>
          <div className="gf-form">
           <label className="gf-form-label query-keyword width-10">Alias</label>
           <div className="gf-form max-width-8">
           <input className="gf-form-input" value={aliasName} onChange={this.onAliasnameChange} placeholder="Alias" ></input>
           </div>
          </div>
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-10">Scale</label>
            <div className="gf-form max-width-8">
              <input className="gf-form-input" value={scale}  placeholder="Multiplier" onChange={this.onScaleChange}></input>
          </div>
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-10">Pattern</label>
            <div className="gf-form max-width-8">
                <input className="gf-form-input" value={pattern} placeholder="Redis Pattern" onChange={this.onPatternChange}></input>
            </div>
          </div>
          </div>
      </div>
      );
    }
  }

  

