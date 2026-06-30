import { useState } from "react";
import { useListTrucks, useCreateTruck, useUpdateTruck, useDeleteTruck, getListTrucksQueryKey } from "@workspace/api-client-react";
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
import { Search, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const truckSchema = z.object({
  registrationNumber: z.string().min(1, "Registration is required"),
  model: z.string().min(1, "Model is required"),
  capacity: z.coerce.number().min(0.1, "Capacity must be greater than 0"),
  fuelType: z.enum(["diesel", "petrol", "electric", "hybrid"]),
  status: z.enum(["available", "assigned", "running", "maintenance"]).optional(),
  notes: z.string().optional(),
});

type TruckFormValues = z.infer<typeof truckSchema>;

export default function Trucks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTruck, setEditTruck] = useState<any>(null);

  const { data: trucks, isLoading } = useListTrucks();
  const createTruck = useCreateTruck();
  const updateTruck = useUpdateTruck();
  const deleteTruck = useDeleteTruck();
  const queryClient = useQueryClient();

  const form = useForm<TruckFormValues>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      registrationNumber: "",
      model: "",
      capacity: 10,
      fuelType: "diesel",
      status: "available",
      notes: "",
    },
  });

  const filteredTrucks = trucks?.filter(t => 
    t.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case "available": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "assigned": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "running": return "bg-primary/10 text-primary border-primary/20";
      case "maintenance": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const onSubmit = (data: TruckFormValues) => {
    if (editTruck) {
      updateTruck.mutate({ id: editTruck.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTrucksQueryKey() });
          setEditTruck(null);
        }
      });
    } else {
      createTruck.mutate({ data: { ...data, fuelType: data.fuelType as any } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTrucksQueryKey() });
          setIsAddOpen(false);
          form.reset();
        }
      });
    }
  };

  const openEdit = (truck: any) => {
    form.reset({
      registrationNumber: truck.registrationNumber,
      model: truck.model,
      capacity: truck.capacity,
      fuelType: truck.fuelType as any,
      status: truck.status as any,
      notes: truck.notes || "",
    });
    setEditTruck(truck);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this truck?")) {
      deleteTruck.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTrucksQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search trucks..." 
              className="pl-8 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) form.reset();
          }}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> Add Truck</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Truck</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl><Input placeholder="ABC-1234" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="model" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make & Model</FormLabel>
                        <FormControl><Input placeholder="Volvo FH16" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="capacity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (Tons)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fuelType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Input placeholder="Additional info..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createTruck.isPending}>
                    {createTruck.isPending ? "Adding..." : "Add Truck"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editTruck} onOpenChange={(open) => {
        if (!open) { setEditTruck(null); form.reset(); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Truck {editTruck?.registrationNumber}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make & Model</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Tons)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={updateTruck.isPending}>
                {updateTruck.isPending ? "Saving..." : "Save Changes"}
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
                <TableHead className="w-[150px]">Registration</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Capacity</TableHead>
                <TableHead className="hidden md:table-cell">Fuel</TableHead>
                <TableHead className="hidden lg:table-cell">Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTrucks?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No trucks found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrucks?.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell className="font-mono font-medium">{truck.registrationNumber}</TableCell>
                    <TableCell>{truck.model}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(truck.status)}`}>
                        {truck.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{truck.capacity}T</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{truck.fuelType}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {format(new Date(truck.createdAt), "MMM d, yyyy")}
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
                          <DropdownMenuItem onClick={() => openEdit(truck)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(truck.id)}
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
