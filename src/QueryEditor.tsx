import React, { ChangeEvent, PureComponent} from 'react';

import defaults from 'lodash/defaults';



import { Select, Switch } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from 'DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from 'types';
import _, {__} from 'lodash'


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
  
  BaseURL: any;
  serverURL: string;
  variablePattern: string;
  dataType = "Log"
  editMode = false;
  //onPatternChange : (event : any) => void;

  state = {selectedSignals : [],editMode : false}



  constructor(instanceSettings: Props) {
    super(instanceSettings);
    this.serverURL = instanceSettings.datasource.serverURL || '';
    this.variablePattern = instanceSettings.datasource.variablePattern || ""
    this.BaseURL = this.serverURL.replace("host",window.location.origin)
    const query = defaults(this.props.query, defaultQuery);
    console.log("signals:" + signalData)
    query.type = query.type ? query.type : "Log"
    this.getSignals(query.type);
  }



  async getSignals(type: string){
    signalData = [];
    let logData: any[] = [];
    await fetch(this.BaseURL + type + "/signals?pattern=*")
    .then(response => response.json())
    .then(data => {
      signalData = [];
      logData = data
      let slicesData: any = logData;
     
      signalData = _.map(slicesData, function(v,i){
        return { label: v, value: v }
      })

      this.setState({selectedSignals : signalData})
    })
    .catch(error => {
      console.error(error)
    });
    
  }

  onServerChange = (event: any) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, target: event ? event.value ? event.value : event.target.value : ""});
    onRunQuery();
  };
  onDisplayNameChange = (event: ChangeEvent<HTMLInputElement>) => {

    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query,checked:event.target.checked });
    onRunQuery();
  };


  
  onDataTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, type: event.target.value,target : "" });
    // executes the query
    query.target = "";
    this.getSignals(event.target.value);
    onRunQuery();
  };


  onAliasnameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, alias: event.target.value });
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
    //let logData: any[] = [];
    //let pattern = ""
    //let type = query.type === "Log" ? "Log":"Live";
    onChange({ ...query, pattern: event.target.value });
    onRunQuery();
  };

  onTextToggleChange = (event: any) => {
    this.setState({editMode : !this.state.editMode})
    console.log(event);

  };

  
  render() {

    const query = defaults(this.props.query, defaultQuery);
    console.log("signals:" + signalData)
    query.type = query.type ? query.type : "Log"
    //let newPattern = getTemplateSrv().replace(query.pattern, this.props.data?.request?.scopedVars);

    //console.log("signals:" + this.variablePattern,newPattern)
    


    const { target,type,checked,alias,scale,pattern } = query;
    
        return (
          <div className="gf-form-group">
            <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-10">Select Type</label>
            <select  className="gf-form-label"
                 value={type} 
                 onChange={this.onDataTypeChange} >
             {Options}
             </select>
             {
              this.state.editMode && <textarea className="gf-form-input" value={target} onChange={this.onServerChange}></textarea>
             }
             <label className="gf-form-label query-keyword width-10">Select Signal<button className="fal fa-edit" onClick={this.onTextToggleChange}/></label>
             {!this.state.editMode &&   
               <Select
                  className="gf-form-label"
                  isMulti={false}
                  id='signalDropdownID'
                  isClearable={true}
                  width = "auto"
                  backspaceRemovesValue={false}
                  //onInputChange ={this.getsearchedSignals()}
                  onChange={this.onServerChange}
                  options={this.state.selectedSignals}
                  isSearchable={true}
                  placeholder= ""
                  value={target}
                  noOptionsMessage={'No options found'}></Select>
                  }
                 
            </div>
            <div className="gf-form">
              <label className="gf-form-label query-keyword width-10">DisplayNames</label>
              <div className="gf-form max-width-4">
              <Switch value = {checked} onChange={this.onDisplayNameChange}/> 
              </div>
            </div>
            <div className="gf-form">
             <label className="gf-form-label query-keyword width-10">Alias</label>
             <div className="gf-form max-width-8">
             <input className="gf-form-input" value={alias} onChange={this.onAliasnameChange} placeholder="Alias" ></input>
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

  

