import express, { Request } from 'express';
import { Server } from 'http';
import expressWs, { Application } from 'express-ws';
import { isJsonString } from './utils/utils';
import Client from './dgraphClient';
import { EventEmitter } from 'ws';
import dgraph from 'dgraph-js';
import { insertsToUpsert } from './utils/txnWrapper';
import { UnigraphUpsert } from './custom';

const PORT = 3001;
const verbose = 5;

export default async function startServer(client: Client) {
  let app: Application;
  let dgraphClient = client;

  type EventMessage = {
    "type": "event",
    "event": string
  };

  const makeResponse = (event: {id: number}, success: boolean, body: object) => {
    return JSON.stringify({
      type: "response",
      success: success,
      id: event.id,
      ...body
    })
  }

  const eventRouter: Record<string, Function> = {
    "query_by_string_with_vars": function (event: EventMessage & {query: string, vars: object, id: number}, ws: {send: Function}) {
      dgraphClient.queryData<any[]>(event.query, event.vars).then(res => {
        ws.send(makeResponse(event, true, {"result": res}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },

    "set_schema": function (event: EventMessage & {schema: string, id: number}, ws: {send: Function}) {
      dgraphClient.setSchema(event.schema).then(_ => {
        ws.send(makeResponse(event, true, {}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "create_data_by_json": function (event: EventMessage & {data: object, id: number}, ws: {send: Function}) {
      dgraphClient.createData(event.data).then(_ => {
        ws.send(makeResponse(event, true, {}));
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    "drop_data": function (event: EventMessage & {id: number}, ws: {send: Function}) {
      dgraphClient.dropData().then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },
  
    "drop_all": function (event: EventMessage & {id: number}, ws: {send: Function}) {
      dgraphClient.dropAll().then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})))
    },

    /**
     * Creates unigraph schema(s) entity in dgraph.
     * @param event The event for creating the schema
     * @param ws Websocket connection
     */
    "create_unigraph_schema": function (event: EventMessage & {data: object | object[], id: number}, ws: {send: Function}) {
      let schema = (Array.isArray(event.data) ? event.data : [event.data]);
      let upsert: UnigraphUpsert = insertsToUpsert(schema);
      dgraphClient.createUnigraphUpsert(upsert).then(_ => {
        ws.send(makeResponse(event, true, {}))
      }).catch(e => ws.send(makeResponse(event, false, {"error": e})));
    },
  };

  const server = await new Promise<Server>(res => {
    ({ app } = expressWs(express()));

    // TODO pull into separate express.Router
    app.ws('/', (ws, req) => {
      ws.on('message', (msg: string) => {
        let msgObject: {type: string | null, event: string | null} = isJsonString(msg)
        if (msgObject) {
          // match events
          if (msgObject && msgObject.type === "event" && msgObject.event && eventRouter[msgObject.event]) {
            if (verbose >= 1) console.log("matched event: " + msgObject.event);
            eventRouter[msgObject.event](msgObject, ws);
          }
          if (verbose >= 2) console.log(msgObject);
        }
      });
      ws.send(JSON.stringify({
        "type": "hello"
      }))
      console.log('opened socket connection');
    });

    const server = app.listen(PORT, () => {
      res(server);
      console.log('\nListening on port', PORT);
    });
  });

  return [app!, server] as const;
}