import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Service for making SPARQL queries. This class contains helpers for sending requests to
 * GraphDB and processing the results.
 */
@Injectable({
  providedIn: 'root',
})
export class QueryService {
  // SPARQL Endpoint
  private endpoint = environment.graphEndpoint;

  // The SPARQL query prefixes
  public prefixes = {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    owl: 'http://www.w3.org/2002/07/owl#',
    dc: 'http://purl.org/dc/elements/1.1/',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    kwgr: 'http://stko-kwg.geog.ucsb.edu/lod/resource/',
    'kwg-ont': 'http://stko-kwg.geog.ucsb.edu/lod/ontology/',
    geo: 'http://www.opengis.net/ont/geosparql#',
    time: 'http://www.w3.org/2006/time#',
    ago: 'http://awesemantic-geo.link/ontology/',
    sosa: 'http://www.w3.org/ns/sosa/',
    elastic: 'http://www.ontotext.com/connectors/elasticsearch#',
    'elastic-index':
      'http://www.ontotext.com/connectors/elasticsearch/instance#',
    iospress: 'http://ld.iospress.nl/rdf/ontology/',
    usgs: 'http://gnis-ld.org/lod/usgs/ontology/',
  };
  // A string representation of the prefixes
  prefixesCombined: string = '';

  /**
   * Service constructor. It's responsible for creating a string representation of the
   * prefixes and creating the HttpClient object used to send queries
   * @param http The HTTP client to perform requests
   */
  constructor(private http: HttpClient) {
    for (let [si_prefix, p_prefix_iri] of Object.entries(this.prefixes)) {
      this.prefixesCombined += `PREFIX ${si_prefix}: <${p_prefix_iri}>\n`;
    }
  }

  /**
   * Performs a SPARQL query
   *
   * @param {string} query The query that is being performed
   * @param {string} query_id The identifier of the query. Should be of the form KE-1234
   * @returns
   */
  async query(query, query_id = 'KE-0') {
    let d_form = new FormData();
    d_form.append('query', this.prefixes + query);
    let d_res: any = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'X-Request-Id': query_id,
      },
      body: this.getRequestBody(query),
    }).catch((error) => {
      console.error('There was an error while running a query: ', error);
    });

    // Status codes need to be manually checked here
    if (d_res.status !== 200) {
      console.warn('There was an error running the query', query, d_res);
      return false;
    }
    return await d_res.json();
  }

  /**
   * Takes a query string without the prefixes and returns the fully crafted query
   * @param query The SPARQL query being prepared
   * @param reason Flag whether reasoning is enabled
   * @returns The request body for a valid SPARQL query against GraphDB
   */
  getRequestBody(query: string, reason: boolean = true) {
    let fullQuery = this.prefixesCombined + query;
    let httpParams = new URLSearchParams();
    httpParams.set('query', fullQuery);
    httpParams.set('infer', String(reason));
    return httpParams;
  }

  /**
   * Creates the headers for a SPARQL query
   *
   * @param id The query identifier
   * @returns A set of headers that are used in a SPARQL query
   */
  getRequestHeaders(id: string) {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
    headers = headers.set('Accept', 'application/sparql-results+json');
    headers = headers.set('X-Request-Id', id);
    return { headers: headers };
  }

  /**
   * Given a sparql query response, return an array of values
   *
   * @param response The HTTP web response
   * @returns The results as an array in the bindings
   */
  getResults(response: any) {
    return response['results']['bindings'];
  }

  /**
   * Retrieves the label for a node
   *
   * @param uri The URI whose label is being retrieved
   */
  getLabel(uri: string) {
    let query = `SELECT ?label WHERE { <` + uri + `> rdfs:label ?label. }`;
    let headers = this.getRequestHeaders('node_explorer_get_label');
    let body = this.getRequestBody(query, false);
    return this.http.post(this.endpoint, body, headers);
  }

  /**
   * Retrieves all of the outbound relations for a node
   *
   * @param uri The URI whose relations are being retrieved
   * @returns The SPARQL ResultsSet from the endpoint
   */
  getOutboundPredicates(uri: string) {
    let query =
      `SELECT DISTINCT ?predicate ?label WHERE { <` +
      uri +
      `> ?predicate ?o. OPTIONAL {?predicate rdfs:label ?label.} BIND(datatype(?object) AS ?data_type) } ORDER BY ASC(?label)`;
    let headers = this.getRequestHeaders(
      'node_explorer_get_outbound_predicates',
    );
    let body = this.getRequestBody(query, false);
    return this.http.post(this.endpoint, body, headers);
  }

  /**
   * Gets the outbound predicates for a node. For example <node ?predicate ?object>
   * @param uri
   * @param predicate
   * @param limit
   */
  getOutboundObjects(uri: string, predicate: string, limit = 100) {
    let query =
      `SELECT DISTINCT ?object ?label ?data_type WHERE { <` +
      uri +
      `> <` +
      predicate +
      `> ?object. OPTIONAL {?object rdfs:label ?label. } BIND(datatype(?object) AS ?data_type)} ORDER BY ASC(?label)    `;
    let headers = this.getRequestHeaders('node_explorer_get_outbound_objects');
    let body = this.getRequestBody(query, true);
    return this.http.post(this.endpoint, body, headers);
  }

  /**
   * Gets the geometry for a node
   *
   * @param uri The URI of the node whose geometry is being retrieved
   */
  getGeometry(uri: string) {
    let query = `SELECT ?geometry WHERE { <${uri}> geo:asWKT ?geometry . }`;
    let headers = this.getRequestHeaders(`node_explorer_get_geometry`);
    let body = this.getRequestBody(query, true);
    return this.http.post(this.endpoint, body, headers);
  }
}
