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
//import {switchMap,takeUntil} from 'rxjs/operators'
import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';
//import { delay } from 'lodash';
//import { TimeSeries } from '@grafana/ui';
 


export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions > {
  serverURL: string;
  wssUrl: string;
  signalData: any;
  variablePattern: any;
  dataType: any;
  BaseURL: any;
  SelectSignal: any;


  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.serverURL = instanceSettings.jsonData.url || 'ws://localhost:8181';
    this.BaseURL = this.serverURL.replace("host",window.location.origin)
    this.wssUrl = this.serverURL.replace("host","wss://" + window.location.host);

  }

   query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {


      const observables = options.targets.map((target) =>  {
      let displayNamesData: any[] = [];
      let URL = window.location.origin
      console.log(URL)
      const query = defaults(target, defaultQuery);
      query.type = query.type ? query.type : "";
      query.target = query.target ||  "";

      this.dataType = query.type;
      query.pattern = getTemplateSrv().replace(query.pattern, options.scopedVars);
      query.alias = getTemplateSrv().replace(query.alias, options.scopedVars);
      query.scale = getTemplateSrv().replace(query.scale, options.scopedVars);
      query.target = getTemplateSrv().replace(query.target, options.scopedVars);
     
      
      //let obser = new Observable<DataQueryResponse>();
     // const stopSignal: Subject<void> = new Subject<void>()
        
       return new Observable<DataQueryResponse>((subscriber: any) => {

                 console.log(this.SelectSignal);
                 
                 let dataField: any[]  = []
                 //console.log(frame);
                 const signalArray: any[] = []
                
                 
                 let isStreaming = false;
                 let streamingData: any;
                 //let server = "wss://10.140.133.144/api/realtime/live?db=global&signal=" + query.server || this.serverURL;
                   
                   let server = this.wssUrl + query.type + "?db=global" + "&signal=" + query.target;
                   if(query.pattern){
                    server = this.wssUrl + query.type + "?db=global" + "&pattern=@(" + query.pattern+ "*)";
                   }else if(query.checked){
                    let Display: any = query.target?.split(".");
                    Display.pop();
                    let DisplayString = Display.join(".");
                    server = this.wssUrl + query.type + "?db=global" + "&pattern=@(" + DisplayString + "*)"
                  }
                  

                   const connection = new WebSocket(server);

                   let interval: NodeJS.Timeout;
                
                   connection.onerror = (error: any) => {
                     console.error(`WebSocket error: ${JSON.stringify(error)}`);
                     clearInterval(interval);
                     //throw new Error("Can't connect to " + this.serverURL);
                   };
                   
                   connection.onmessage = (event: any) => {

                     let jsonData = JSON.parse(event.data);
                     console.log(jsonData);
                     let finalData = jsonData;
                     let hasDisplayName = "";

                      if(query.type === "Live"){

                     
                     hasDisplayName = Object.keys(jsonData).find(k => k.endsWith("displayName")) || "";

                     //let finalData = jsonData[query.server ? query.server : 0]
                     if(query.checked && !query.pattern && hasDisplayName === ""){
                       finalData = []
                       finalData[query.target || ""] = jsonData[query.target || ""];
                     }

                     if(finalData){
                      dataField.push("timestamp")
                      if(!isStreaming){
                        Object.keys(finalData).forEach(function (k) {
                          signalArray.push(k)
                          dataField.push(k)
                          if(query.checked && k.endsWith("displayName")){
                           let d = {
                             signalName : k,
                             displayName : finalData[k].value
                           }
                           displayNamesData.push(d);
                          }
                       })
                      }
                    }
                     
                     console.log("finaldata" + finalData);
                     let frameData: any = [];
                     let aliasName: any;
                     if(query.alias){
                         aliasName = query.alias;
                     }
                     if(!isStreaming){
                       streamingData = finalData;
                       isStreaming = true;
                     }
                     console.log("alias" + aliasName)
                     let count = 0;
                     signalArray.map((sig) => {
                       let displayKey = 0;
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
                         if(signalArray.length === 1 && query.alias !== undefined && aliasName !== undefined)
                         {
                           frameData[aliasName] = value
                         }else{
                           frameData[sig] = value                     
                         }
                         if(query.checked){
                         let Display: any = sig.split(".");
                         Display.pop();
                         let DisplayString = Display.join(".");
                         signalArray.map((k) => {
                           if(k === DisplayString + ".displayName"){
                              displayKey = 1;
                           }
                         })
                         if(signalArray.length === 1 && displayNamesData.length === 1){
                           displayKey = 1;
                         }
                       }  
 
                       if(displayKey === 0){
                         let frame: any = {}
                         frame["frame"+count] = new CircularDataFrame({
                          append: 'tail',
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
                            data: [frame["frame"+count]],
                            key: query.refId + count,
                            state: LoadingState.Streaming,
                          })
                        
                         count=count + 1

                         //return observable
                        //this.queryResponse((subscriber : any) => {
                          
                       // })
                       }
                       
                       
                     }
                     })
                     if(query.checked && displayNamesData.length > 0){
                       displayNamesData.map((sig: any) => {
                         if(streamingData[sig.signalName] !== undefined){
                           let DisplayString: any = sig.signalName.split(".");
                           DisplayString.pop();
                           DisplayString.push("value")
                           let displayKey = DisplayString.join(".")
                           frameData = {};
                           let value: any = finalData[displayKey] === undefined ? streamingData[displayKey].value : finalData[displayKey].value
                           frameData["timestamp"] = finalData[displayKey] === undefined ? streamingData[displayKey].timestamp : finalData[displayKey].timestamp;
                           if(query.scale !== undefined && Number(query.scale) > 0){
                              value = value * Number(query.scale);
                           }
                           if(finalData[displayKey] !== undefined && isStreaming){
                             streamingData[displayKey] = finalData[displayKey];
                           }
                           
                           frameData[sig.displayName] = value
                           
                           let frame: any = {}
                           frame["frame"+count] = new CircularDataFrame({
                            append: 'tail',
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
                              data: [frame["frame"+count]],
                              key: query.refId + count,
                              state: LoadingState.Streaming,
                            })
                      
                           count=count + 1

                           //return observable
                       }
                       else if(displayNamesData.length === 1 && signalArray.length === 1){
                         frameData = {};
                         let frame: any = {}
                           frame["frame"+count] = new CircularDataFrame({
                            append: 'tail',
                          });
                         
                           frameData["timestamp"] = finalData[signalArray[0]].timestamp;
                           frameData[sig.displayName] = finalData[signalArray[0]].value
                           
                        
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
                              data: [frame["frame"+count]],
                              key: query.refId + count,
                              state: LoadingState.Streaming,
                            })
                           
                           count=count + 1
                          // return observable
                       }
                       })

                     }
                    }else{
                        let frameData: any = finalData[0];
                        signalArray.push(query.target)

                        let logData: any = {};
                        finalData.map((test: any)=> {
                          Object.keys(test).forEach(function(k){
                            logData[k] = logData[k] ? logData[k] : [];
                            logData[k].push(test[k])
                          })
                        })
                        // finalData.map((test1 : any)=> {
                        //   logData[test1] = [];
                        // })
                        let count: any = 0
                        let frame: any = {}
                        
                        frame["frame"+count] = new CircularDataFrame({
                         append: 'tail',
                        });
                       if (frame["frame"+count].fields.length <= 1) {
                       
                         //first time initalize the keys from the json data
                         Object.keys(frameData).forEach(function (k) {

                           if (k === "timestamp") {
                             frame["frame"+count].addField({ name: k, type: FieldType.time , values: logData[k] });
                           }  
                           else{
                             frame["frame"+count].addField({ name: k, type:  Number(frameData[k]) >= 0 ? FieldType.number : FieldType.string , values : logData[k]});
                           }
                         });
                     
                       };
                      // frame["frame"+count].addField(finalData);
                        
                      
                         subscriber.next({
                           data: [frame["frame"+count]],
                           key: query.refId + count,
                           state: LoadingState.Streaming,
                         })
                       
                        count=count + 1

                        //return observable
                       //this.queryResponse((subscriber : any) => {
                         
                      // })
                      
                      
                   
                    
                    }
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

    delay(ms: number): Promise<void> {
      return new Promise<void>((resolve) => {
        setTimeout(()=> {
          resolve();
        },ms)
      })
    }

    async processData(options: DataQueryRequest<MyQuery>) {
       options.targets.map(async (target) =>  {
        const query = defaults(target, defaultQuery);
        query.type = query.type ? query.type : "";
        query.pattern = getTemplateSrv().replace(query.pattern, options.scopedVars);
       await fetch(this.BaseURL + query.type + "/signals?pattern=" + query.pattern)
        .then(response => response.json())
        .then(data => {
          //query.selectedSignals = data;
        })
        .catch(error =>{
         
          console.error(error)
        });
      })
      
      
    }


  async testDatasource() {
    await fetch(this.BaseURL + "live/signals?pattern=*")
    .then(response => response.json())
    .then(data => {     
      if(data.length > 0){
        return {
          status: 'success',
          message: 'Data source tests - Success',
        };
      }else{
        return{
          status: 'fail',
          message: 'No signals found'
        }
      }
    })
    .catch(error => {
      console.error(error)
      return{
        status: 'fail',
        message: 'Database Connection failed'
      }
    });
    // TODO: Implement a health check for your data source.
    
  }

  
}
