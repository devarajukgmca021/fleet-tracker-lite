import { useState } from "react";
import { useListAlerts, useMarkAlertRead, getListAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MapPin, Truck, Clock, WifiOff, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Alerts() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: alerts, isLoading } = useListAlerts({ unreadOnly: unreadOnly ? true : undefined });
  const markRead = useMarkAlertRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] }); // Just in case
      }
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "trip_started": return <MapPin className="h-5 w-5 text-blue-500" />;
      case "trip_completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "truck_delayed": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "overspeed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "truck_offline": return <WifiOff className="h-5 w-5 text-slate-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
        <div className="flex items-center space-x-2 bg-card p-2 rounded-md border">
          <Switch id="unread-only" checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          <Label htmlFor="unread-only" className="cursor-pointer">Show Unread Only</Label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity & Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : alerts?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts?.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg border ${!alert.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 p-2 rounded-full ${!alert.isRead ? 'bg-background' : 'bg-muted'}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{alert.message}</span>
                        {!alert.isRead && <Badge variant="default" className="text-[10px] uppercase h-5">New</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>{format(new Date(alert.createdAt), "MMM d, yyyy HH:mm")}</span>
                        {alert.truckId && <span>Truck #{alert.truckId}</span>}
                        {alert.tripId && <span>Trip #{alert.tripId}</span>}
                      </div>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => handleMarkRead(alert.id)}
                      disabled={markRead.isPending}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
