import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useGetLiveTracking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Truck, Navigation, Activity } from "lucide-react";
import { format } from "date-fns";

// Fix leaflet icon path issues
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

export default function Tracking() {
  const { data: positions, refetch } = useGetLiveTracking();

  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Center map on average position or default to Europe/US
  const defaultCenter: [number, number] = [39.8283, -98.5795]; // US Center
  const center = positions && positions.length > 0
    ? [positions[0].lat, positions[0].lng] as [number, number]
    : defaultCenter;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary animate-pulse" />
          Live GPS Tracking
        </h1>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Updating Live
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        <Card className="flex-1 overflow-hidden relative min-h-[400px]">
          <MapContainer 
            center={center} 
            zoom={4} 
            className="w-full h-full z-0"
            style={{ minHeight: "400px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions?.map((pos) => (
              <Marker key={pos.truckId} position={[pos.lat, pos.lng]}>
                <Popup className="min-w-[200px]">
                  <div className="p-1">
                    <div className="font-bold text-sm mb-1">{pos.truckRegistration}</div>
                    <div className="text-xs text-muted-foreground mb-2">{pos.driverName}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="font-semibold text-slate-500">Speed</span><br/>
                        {pos.speed ? `${pos.speed} km/h` : 'Stopped'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Status</span><br/>
                        <span className="capitalize text-primary">{pos.status}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t">
                      Last seen: {format(new Date(pos.recordedAt), "HH:mm:ss")}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        <Card className="w-full lg:w-80 flex flex-col h-[400px] lg:h-auto shrink-0">
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5" /> Active Fleet
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {positions?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No active trucks to track right now.
                </div>
              ) : (
                <div className="divide-y">
                  {positions?.map((pos) => (
                    <div key={pos.truckId} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-mono font-bold flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          {pos.truckRegistration}
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-500 border-green-500/20">
                          {pos.speed ? `${pos.speed} km/h` : 'Stopped'}
                        </Badge>
                      </div>
                      <div className="text-sm mb-1">{pos.driverName}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</span>
                        <span>{format(new Date(pos.recordedAt), "HH:mm")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
