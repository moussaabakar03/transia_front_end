import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapComponent implements AfterViewInit {
  @Input() locations: Array<{ lat: number; lng: number; label?: string }> = [];
  @Input() center?: { lat: number; lng: number };
  @Input() zoom: number = 13;

  mapInitialized = false;

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    // Note: This is a placeholder for map integration
    // In a real implementation, you would use Leaflet or Google Maps
    // For now, this component provides the structure for future integration
    console.log('Map component initialized with locations:', this.locations);
    this.mapInitialized = true;
  }
}
