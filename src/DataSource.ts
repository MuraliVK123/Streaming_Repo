import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  CircularDataFrame,
  FieldType,
  LoadingState,
  
  //toDataFrame
} from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { Observable, merge } from 'rxjs';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';
//import { TimeSeries } from '@grafana/ui';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  serverURL: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.serverURL = instanceSettings.jsonData.url || 'ws://localhost:8181';
  }
  

    query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
      
      
      const observables =  options.targets.map(target => {
        // let min = options.range.from.valueOf();
        // let max = options.range.to.valueOf();
        // let order = "asc"
      const query = defaults(target, defaultQuery);
       query.server = getTemplateSrv().replace(query.server, options.scopedVars)
      // query.dataType = getTemplateSrv().replace(query.dataType, options.scopedVars)
      // query.IsDisplayName = Boolean(getTemplateSrv().replace(query.IsDisplayName ? String(query.IsDisplayName) : "false", options.scopedVars))
      query.server = query.server ? query.server : "";
      
      console.log("Query" + query);

      
        return new Observable<DataQueryResponse>(subscriber => {
           //query.capacity =  parseFloat(getTemplateSrv().replace(query.capacity.toString(), options.scopedVars))
          
           //const frame1 : TimeSeries;
                let signalString = ""
                
                let dataField: any[]  = []
                //console.log(frame);
                query.selectedSignals = query.selectedSignals ? query.selectedSignals : [];
                const signalArray: any[] = query.selectedSignals
                if(query.selectedSignals.length > 0){
                  dataField.push("timestamp")
                  signalArray.map((sig) => {
                     signalString = signalString + "&signal=" + sig;
                     dataField.push(sig)
                  })
                }
                
                let isStreaming = false;
                let streamingData: any;
                //let server = "wss://10.140.133.144/api/realtime/live?db=global&signal=" + query.server || this.serverURL;
          
                  let server = "wss://10.171.111.43/api/realtime/live?db=global" + signalString;

                  const connection = new WebSocket(server);
                  let interval: NodeJS.Timeout;
                 // frame.refId = query.refId;
          
                  connection.onerror = (error: any) => {
                    console.error(`WebSocket error: ${JSON.stringify(error)}`);
                    clearInterval(interval);
                    //throw new Error("Can't connect to " + this.serverURL);
                  };
                  
                  connection.onmessage = (event: any) => {
                    let jsonData = JSON.parse(event.data);
                    console.log(jsonData);
                    //let finalData = jsonData[query.server ? query.server : 0]
                    let finalData = jsonData;
                    console.log("finaldata" + finalData);
                    let frameData: any = [];
                    let aliasName: any;
                    if(query.aliasName){
                        aliasName = query.aliasName;
                    }
                    if(!isStreaming){
                      streamingData = finalData;
                      isStreaming = true;
                    }
                    console.log("alias" + aliasName)
                    let count = 0;
                    signalArray.map((sig) => {
                      if(sig !== "timestamp" && streamingData[sig] !== undefined){
                        frameData = {};
                        let value: any = finalData[sig] === undefined ? streamingData[sig].value : finalData[sig].value
                        frameData["timestamp"] = finalData[sig] === undefined ? streamingData[sig].timestamp : finalData[sig].timestamp;
                        if(query.scale !== undefined && Number(query.scale) > 0){
                           value = value * Number(query.scale);
                        }
                        if(finalData[sig] !== undefined && isStreaming){
                          streamingData[sig] = finalData[sig];
                        }
                        if(signalArray.length === 1 && query.aliasName !== undefined && aliasName !== undefined)
                        {
                          frameData[aliasName] = value
                        }else{
                          frameData[sig] = value                     
                        }
                        
                      let frame: any = {}
                       frame["frame"+count] = new CircularDataFrame({
                        append: 'tail',
                        capacity: query.capacity || 1000,
                      });
                      if (frame["frame"+count].fields.length <= 1) {
                      
                        //first time initalize the keys from the json data
                        Object.keys(frameData).forEach(function (k) {
                          
                          if (k === "timestamp") {
                            frame["frame"+count].addField({ name: k, type: FieldType.time });
                          }  
                          else{
                            frame["frame"+count].addField({ name: k, type:  Number(frameData[k]) >= 0 ? FieldType.number : FieldType.string});
                          }
                        });
                    
                      };
                      frame["frame"+count].add(frameData);
                       
  
                      subscriber.next({
                        //data:  [toDataFrame(frame.fields)],
                        //data:  [Object.values(frame.fields[0].values)],
                        data: [frame["frame"+count]],
                        key: query.refId + count,
                        state: LoadingState.Streaming,
                      });
                      count=count + 1
                    }
                    })
                  };
          
                  connection.onclose = (ev: CloseEvent) => {
                    console.log("WebSocket closed: " + ev.reason)
                    clearInterval(interval);
                  }
                  return () => {
                    connection.close(1000, "Dashboard closed");
                  }
         });
      
    
    });
    console.log(...observables);
    return merge(...observables);
    }

   

  async doRequest(options: any){
    let logData: any[] = [];
    
    await fetch("https://10.140.133.144/api/realtime/log?db=global&signal=" + options + ":ResultsLog")
    .then(response => response.json())
    .then(data => {
      logData = data
      return logData.map((row) => ({
        time: row.timestamp,
        value: row.value,
      })); 
    })
    .catch(error => console.error(error));
  };
   
  

  


  async testDatasource() {
    // TODO: Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Data source tests - Success',
    };
  }
}
