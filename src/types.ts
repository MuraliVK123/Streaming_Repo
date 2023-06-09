import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
  server?: string;
  capacity: number;
  timeoutS: number;
  dataType?: string;
  IsDisplayName?: boolean;
  aliasName?: string;
  scale?: string;
  pattern?: string;
  selectedSignals: any;
  displayNamesData: any;
  
}

export const defaultQuery: Partial<MyQuery> = {
 
  IsDisplayName : false,
 // dataType : "Streaming"

  //server: "ws://test:8080",
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
}

export interface MyVariableQuery {
  namespace: string;
  query: string;
  rawQuery?: string
}
