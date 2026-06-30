import { useState } from "react";
import { 
  useListTrips, 
  useCreateTrip, 
  useUpdateTrip, 
  useDeleteTrip, 
  useStartTrip,
  useCompleteTrip,
  useListTrucks,
  useListDrivers,
  getListTripsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Edit, Trash2, MoreHorizontal, Play, CheckCircle, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const tripSchema = z.object({
  pickupLocation: z.string().min(1, "Pickup location is required"),
  pickupLat: z.coerce.number().optional(),
  pickupLng: z.coerce.number().optional(),
  destination: z.string().min(1, "Destination is required"),
  destLat: z.coerce.number().optional(),
  destLng: z.coerce.number().optional(),
  truckId: z.coerce.number().optional(),
  driverId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function Trips() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<any>(null);

  const { data: trips, isLoading } = useListTrips(statusFilter !== "all" ? { status: statusFilter } : undefined);
  const { data: trucks } = useListTrucks({ status: "available" });
  const { data: drivers } = useListDrivers({ available: true });
  
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const startTrip = useStartTrip();
  const completeTrip = useCompleteTrip();
  const queryClient = useQueryClient();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      pickupLocation: "",
      destination: "",
      notes: "",
    },
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "started": 
      case "running": return "bg-primary/10 text-primary border-primary/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const onSubmit = (data: TripFormValues) => {
    if (editTrip) {
      updateTrip.mutate({ id: editTrip.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          setEditTrip(null);
        }
      });
    } else {
      createTrip.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
          setIsAddOpen(false);
          form.reset();
        }
      });
    }
  };

  const openEdit = (trip: any) => {
    form.reset({
      pickupLocation: trip.pickupLocation,
      destination: trip.destination,
      truckId: trip.truckId,
      driverId: trip.driverId,
      notes: trip.notes || "",
    });
    setEditTrip(trip);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      deleteTrip.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        }
      });
    }
  };

  const handleStatusAction = (id: number, action: 'start' | 'complete' | 'cancel') => {
    if (action === 'start') {
      startTrip.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() }) });
    } else if (action === 'complete') {
      completeTrip.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() }) });
    } else if (action === 'cancel') {
      updateTrip.mutate({ id, data: { status: 'cancelled' } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() }) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Active Operations</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) form.reset();
          }}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> New Trip</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispatch New Trip</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="pickupLocation" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location</FormLabel>
                        <FormControl><Input placeholder="Warehouse A..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="destination" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl><Input placeholder="Client Site B..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="truckId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Truck</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select available truck" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {trucks?.map(t => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.registrationNumber} ({t.model})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="driverId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Driver</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {drivers?.map(d => (
                              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispatch Notes</FormLabel>
                      <FormControl><Input placeholder="Special instructions..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createTrip.isPending}>
                    {createTrip.isPending ? "Creating..." : "Create Trip"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editTrip} onOpenChange={(open) => {
        if (!open) { setEditTrip(null); form.reset(); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip #{editTrip?.id}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickupLocation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Location</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destination" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispatch Notes</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={updateTrip.isPending}>
                {updateTrip.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="hidden md:table-cell">Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Distance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : trips?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No trips found.
                  </TableCell>
                </TableRow>
              ) : (
                trips?.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono font-medium">#{trip.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{trip.pickupLocation}</div>
                      <div className="text-muted-foreground text-xs">→ {trip.destination}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{trip.truckRegistration || "Unassigned"}</div>
                      <div className="text-xs text-muted-foreground">{trip.driverName || "Unassigned"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {trip.distanceCovered ? `${trip.distanceCovered.toFixed(1)} km` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {trip.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusAction(trip.id, 'start')} className="text-primary focus:text-primary focus:bg-primary/10">
                              <Play className="mr-2 h-4 w-4" /> Start Trip
                            </DropdownMenuItem>
                          )}
                          {(trip.status === 'started' || trip.status === 'running') && (
                            <DropdownMenuItem onClick={() => handleStatusAction(trip.id, 'complete')} className="text-green-500 focus:text-green-500 focus:bg-green-500/10">
                              <CheckCircle className="mr-2 h-4 w-4" /> Complete Trip
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEdit(trip)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {(trip.status === 'pending' || trip.status === 'started' || trip.status === 'running') && (
                            <DropdownMenuItem onClick={() => handleStatusAction(trip.id, 'cancel')} className="text-orange-500 focus:text-orange-500 focus:bg-orange-500/10">
                              <XCircle className="mr-2 h-4 w-4" /> Cancel Trip
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(trip.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
