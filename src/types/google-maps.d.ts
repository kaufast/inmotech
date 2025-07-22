declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(center: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getBounds(): LatLngBounds | null;
      getCenter(): LatLng | undefined;
      getZoom(): number | undefined;
      addListener(eventName: string, handler: Function): any;
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      mapTypeControl?: boolean;
      gestureHandling?: string;
      styles?: MapTypeStyle[];
    }
    
    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: any[];
    }
    
    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }
    
    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      addListener(eventName: string, handler: Function): any;
    }
    
    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string | Element): void;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    
    class LatLngBounds {
      extend(point: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
    }
    
    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
    }
    
    interface InfoWindowOpenOptions {
      anchor?: Marker;
      map?: Map;
    }
    
    interface Icon {
      url: string;
      scaledSize?: Size;
    }
    
    interface Symbol {
      path: string;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      scale?: number;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }
    
    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): any;
      function removeListener(listener: any): void;
    }
    
    namespace places {
      class SearchBox {
        constructor(input: HTMLInputElement, options?: SearchBoxOptions);
        setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
        getBounds(): LatLngBounds | undefined;
        getPlaces(): PlaceResult[] | undefined;
        addListener(eventName: string, handler: Function): any;
      }
      
      interface SearchBoxOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
      }
      
      interface PlaceResult {
        geometry?: {
          location: LatLng;
          viewport?: LatLngBounds;
        };
        name?: string;
        formatted_address?: string;
      }
    }
    
    interface LatLngBoundsLiteral {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  }
}