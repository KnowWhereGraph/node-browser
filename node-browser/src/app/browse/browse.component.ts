import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QueryService } from '../services/query.service';
import { environment } from '../../environments/environment';

/**
 * A component that represents the main search page. It controls the logic for handling tab switching (ie clicking 'People', 'Places' or 'Hazards).
 * Based on the tab clicked, it renders the appropriate table component.
 */
@Component({
  selector: 'browse',
  templateUrl: './browse.component.html',
  styleUrls: [
    './browse.component.scss',
    '../../../node_modules/leaflet/dist/leaflet.css',
  ],
})
export class BrowseComponent implements OnInit {
  // The identifier of the node being presented
  node_id: string = '';
  // The name of the node (rdfs:label) that's shown as the page title
  node_name: string = '';
  // The full path to the node (eg stko-kwg.ucsb.edu/lod/resource/1234)
  full_node_id: string = '';
  // Flag used to show or hide the map
  enableMap: boolean = false;
  // Holds the geometry string that the map uses
  geometry: Array<string>;
  // The fully qualified URI of predicates that should appear at the top of the page
  preferred_predicate_order: Array<string> = [
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'http://www.w3.org/2000/01/rdf-schema#label',
    'http://www.opengis.net/ont/geosparql#hasDefaultGeometry',
  ];
  // List of predicates to hide from the table
  hide_list = ['http://www.w3.org/2002/07/owl#sameAs'];
  // Data structure that holds information about a single predicate
  public outbound_relations: Array<{
    predicate_name: string;
    predicate_label: string | undefined;
    predicate_link: string;
    predicate_kwg_link: string;
    objects: Array<{
      name: string;
      link: string;
      isPredicate: boolean;
      localURI: string;
      dataType: string;
    }>;
  }> = [];
  // Data structure that holds the tows that are shown in the predicate table
  public rows: Array<{ predicate: string; object: string }> = [];

  /**
   *
   * @param name1 The first name being compared
   * @param name2 The second name being compared
   * @returns Whether the
   */
  private sortRelations(name1: string, name2: string) {
    name1 = name1.toUpperCase();
    name2 = name2.toUpperCase();
    return name1 < name2 ? -1 : name1 > name2 ? 1 : 0;
  }

  /**
   * Constructs the browse component by fetching the outgoing predicates and a geometry, if available
   *
   * @param route The Angualr route object for the request
   * @param queryService The service used to make SPARQL requests
   */
  constructor(
    private route: ActivatedRoute,
    private queryService: QueryService,
  ) {
    this.geometry = [];
    this.enableMap = false;
    this.route.fragment.subscribe((fragment) => {
      if (fragment != null) {
        this.node_id = fragment;
      }
      this.full_node_id = this.getFullNodePath(this.node_id);
    });

    this.queryService.getLabel(this.full_node_id).subscribe({
      next: (response) => {
        let parsedResponse = this.queryService.getResults(response);
        parsedResponse.forEach((predicate) => {
          this.node_name = predicate.label.value;
        });
      },
    });

    this.queryService.getOutboundPredicates(this.full_node_id).subscribe({
      next: (response) => {
        let parsedResponse = this.queryService.getResults(response);
        parsedResponse.forEach((predicate) => {
          if (this.hide_list.includes(predicate.predicate.value)) {
            return;
          }
          // Loop over each predicate and get the first 100 relations
          let outbounds: Array<{
            name: string;
            link: string;
            isPredicate: boolean;
            localURI: string;
            dataType: string;
          }> = [];
          this.queryService
            .getOutboundObjects(this.full_node_id, predicate.predicate.value)
            .subscribe({
              next: (response) => {
                let parsedObjects = this.queryService.getResults(response);
                let location: string | undefined = undefined;
                parsedObjects.forEach((obj) => {
                  // The shortened path of http://localhost:4200/browse/#<object here>
                  let localURI = '';
                  // If the response doesn't have a label-but is a literal, use the literal as the label
                  if (obj.label == undefined) {
                    if (obj.object.type == 'literal') {
                      outbounds.push({
                        name: obj.object.value,
                        link: '',
                        isPredicate: true,
                        localURI: localURI,
                        dataType: obj.data_type.value,
                      });
                    } else {
                      // Otherwise use the shortened URI
                      outbounds.push({
                        name: this.getExternalPrefix(obj.object.value),
                        link: obj.object.value,
                        isPredicate: false,
                        localURI: this.getExternalKWGPath(obj.object.value),
                        dataType: '',
                      });
                    }
                  } else {
                    // Otherwise use the given 'label' predicate
                    let found = outbounds.findIndex((outbound_record) => {
                      return outbound_record.link == obj.object.value;
                    });
                    if (found < 0) {
                      localURI = this.getExternalKWGPath(obj.object.value);
                      outbounds.push({
                        name: obj.label.value,
                        link: obj.object.value,
                        isPredicate: false,
                        localURI: localURI,
                        dataType: '',
                      });
                    }
                    // Check to see if the geometry can be sent to the map
                    if (
                      predicate.predicate.value ===
                        'http://www.opengis.net/ont/geosparql#hasGeometry' ||
                      predicate.predicate.value ===
                        'http://www.opengis.net/ont/geosparql#hasDefaultGeometry'
                    ) {
                      // Get the geometry for the URI
                      this.queryService
                        .getGeometry(obj.object.value)
                        .subscribe({
                          next: (response) => {
                            let geometry_response =
                              this.queryService.getResults(response);
                            if (geometry_response.length) {
                              this.geometry =
                                geometry_response[0].geometry.value;
                              this.enableMap = true;
                            } else {
                              console.warn(
                                'Found a geometry predicate, but failed to retrieve the geometry as WKT.',
                              );
                            }
                          },
                        });
                    }
                  }
                });
              },
            });
          let name = this.getPredicateName(predicate.predicate);
          let label = undefined;
          if (predicate.label) {
            label = predicate.label.value;
          }
          // Check that this URI doesn't already exist
          let found = this.outbound_relations.findIndex((outbound_record) => {
            return outbound_record.predicate_link == predicate.predicate.value;
          });
          if (found < 0) {
            this.outbound_relations.push({
              predicate_name: name,
              predicate_label: label,
              predicate_link: predicate.predicate.value,
              predicate_kwg_link: this.getExternalKWGPath(
                predicate.predicate.value,
              ),
              objects: outbounds,
            });
          }
        });
        //this.outbound_relations.sort((a,b) => this.sortRelations(a.predicate_name,b.predicate_name));
      },
    });
  }

  /**
   * Gets the name of a predicate, in a human readable form
   *
   * @param predicate The predicate whose name is bing retrieved
   * @returns The predicate name
   */
  private getPredicateName(predicate) {
    if ('label' in predicate) {
      return predicate.label.value;
    } else {
      return this.getExternalPrefix(predicate.value);
    }
  }

  /**
   * Gets the full path of a prefixed URI
   *
   * @param uri The URI whose full path is being retrieved
   * @returns The full path of the URI
   */
  private getFullNodePath(uri: string) {
    let prefix = uri.split(':')[0];
    let val = this.queryService.prefixes[prefix];
    return uri.replace(prefix.concat(':'), val);
  }

  /**
   * Gets the 'browse' page URL.
   *
   * @param uri The URI of the node being viewed
   * @returns A URL to the browse route
   */
  getExternalKWGPath(uri: string) {
    return `${environment.baseAddress}browse/#${this.getExternalPrefix(uri)}`;
  }

  /**
   * Given a uri of an externally defined word, attempt to add a prefix to it.
   *
   * @param uri The URI of the word
   * @returns The prefixed URI
   */
  private getExternalPrefix(uri: string) {
    let prefixes = this.queryService.prefixes;
    for (const key of Object.keys(this.queryService.prefixes)) {
      if (uri.includes(prefixes[key])) {
        return uri.replace(prefixes[key], key.concat(':'));
      }
    }
    return uri;
  }

  ngOnInit(): void {}
}
