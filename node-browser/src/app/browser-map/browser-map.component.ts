import { Component, Input, AfterViewInit, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet.markercluster';
import * as wkt from 'wicket';

/**
 * Component for the map interface. This component is responsible for handling map
 * updates and displaying information on the map.
 */
@Component({
  selector: 'browser-map',
  templateUrl: './browser-map.component.html',
  styleUrls: ['./browser-map.component.scss'],
})
export class BrowserMap implements AfterViewInit {
  private map: any;
  @Input() geometry: any;

  /**
   * Updates the geometry on the map with a new geojson feature.
   */
  private updateGeometry(): void {
    let wktParser = new wkt.Wkt();
    let wktRepresentation = wktParser.read(this.geometry).toJson();
    let geojson = L.geoJSON(wktRepresentation).toGeoJSON();
    let gm = L.geoJSON(geojson).addTo(this.map);
    this.map.invalidateSize();
    this.map.fitBounds(gm.getBounds());
  }

  /**
   * Initialize the map with the tile layer.
   */
  private initMap(): void {
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
      zoom: 3,
    });
    const tiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );
    tiles.addTo(this.map);
  }

  ngAfterViewInit(): void {}

  /**
   * Listens for changes on the geometry object. The only times it will change is on a new
   * page load, so also initialize the map
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    for (let property in changes) {
      if (property === 'geometry' && this.geometry.length) {
        this.initMap();
        this.updateGeometry();
      }
    }
  }
}
