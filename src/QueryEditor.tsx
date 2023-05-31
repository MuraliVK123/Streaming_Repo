import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent  } from 'react';


import { Select, Switch } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';




   const options = [
    "Log","Live"
   ]

   let signalData: any[] = []

  
   const Options = options.map((option) => (
     <option key={option} value={option}>
       {option}
     </option>
   ));

 
   
  
type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  
  serverURL: string;
  variablePattern: string;

  

  constructor(instanceSettings: Props) {
    super(instanceSettings);
    this.serverURL = instanceSettings.datasource.serverURL || '';
    this.variablePattern = instanceSettings.datasource.variablePattern || ""
    
   // this.OnInit()

  }

  

  OnInit() {

    // // call api or anything
    // signalData = [];
    // let logData: any[] = [];
    // fetch("http://liveserver-bridge:8080/live/signals?pattern=" + "*")
    // .then(response => response.json())
    // .then(data => {
    //   signalData = [];
    //   logData = data
    //   let slicesData: any = logData;
    //   slicesData.map((option: any, i: any) => {
    //     signalData.push({label : option , value : option})
    //   });
    // })
    // .catch(error => {
    //   console.error(error)
    // });
    }

 

  async getSignals(type: string){
    signalData = [];
    let logData: any[] = [];
    await fetch("https://"+this.serverURL+"/api/realtime/" + type + "/signals?pattern=*")
    .then(response => response.json())
    .then(data => {
      signalData = [];
      logData = data
      let slicesData: any = logData;
      slicesData.map((option: any, i: any) => {
        signalData.push({label : option , value : option})
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
    let displayData: any[] = [];
    let type = query.dataType === "Log" ? "Log":"Live";
    let displayPatterns = query.pattern ? query.pattern.split("|") : (query.server ? query.server.split("|") : []) ;
    let _displayPattern: any = [];
   if(event.target.checked){
    displayPatterns.forEach((p, i) => {
      let pat = p.split(".");
      if(pat.length > 1){
        pat.pop();
      }
      if(!p.includes("displayName")){
        pat.push("*displayName");
      }
      _displayPattern.push(pat.join(".").replace("@(","").replace(")",""));
    });
    let displayPattern = "@("+_displayPattern.join("|")+")";
    fetch("https://"+this.serverURL+"/api/realtime/"+ type + "?pattern=" + displayPattern)
    .then(response => response.json())
    .then(data => {
      let dName = data
      Object.keys(dName).forEach(function (k) {
        let d = {
          signalName : dName[k].name,
          displayName : dName[k].value
        }
        displayData.push(d);
      })
     
      if(data.status === "error"){
        onChange({ ...query,displayNamesData:displayData,IsDisplayName:event.target.checked });
        onRunQuery();
      }else{
        onChange({ ...query,displayNamesData:displayData,IsDisplayName:event.target.checked });
        onRunQuery();
      }
      
    })
    .catch(error =>{
      onChange({ ...query, IsDisplayName: event.target.checked,selectedSignals:displayData });
      console.error(error)
    });

    onRunQuery();
   }else{
    onChange({ ...query,displayNamesData:displayData,IsDisplayName:event.target.checked });
    onRunQuery();
   }
    

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
    onRunQuery();
    if(event.target.value !== ""){
       pattern =  "@("+ event.target.value + ")"
    }
   
    console.log("" + this.variablePattern);

    fetch("https://"+this.serverURL+"/api/realtime/"+ type + "/signals?pattern=" + pattern)
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

    
    console.log("signals:" + signalData)
    query.dataType = query.dataType ? query.dataType : "Log"
    //this.getSignals(query.dataType)
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
                  isClearable={true}
                  backspaceRemovesValue={false}
                  onChange={this.onServerChange}
                  options={signalData}
                  isSearchable={true}
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

  

