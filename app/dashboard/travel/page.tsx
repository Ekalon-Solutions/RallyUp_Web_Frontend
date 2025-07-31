"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, MapPin, Clock, Users, Search, Calendar, Hotel, Plane } from "lucide-react"
import { TravelBookingModal } from "@/components/modals/travel-booking-modal"

const travelBookings = [
  {
    id: 1,
    destination: "Liverpool",
    match: "Liverpool vs Arsenal",
    date: "May 22, 2025",
    departure: "12:00",
    return: "19:00",
    transport: "Coach",
    capacity: "50",
    booked: "47",
    price: "£35",
    status: "Confirmed",
    meetingPoint: "Emirates Stadium",
  },
  {
    id: 2,
    destination: "Manchester",
    match: "Manchester United vs Arsenal",
    date: "June 5, 2025",
    departure: "11:30",
    return: "18:30",
    transport: "Coach",
    capacity: "50",
    booked: "23",
    price: "£40",
    status: "Open",
    meetingPoint: "North London SC",
  },
]

const hotelBookings = [
  {
    id: 1,
    destination: "Barcelona",
    match: "Barcelona vs Arsenal (Champions League)",
    checkIn: "March 15, 2025",
    checkOut: "March 17, 2025",
    hotel: "Hotel Barcelona Center",
    rooms: "25",
    booked: "22",
    pricePerNight: "€120",
    status: "Confirmed",
  },
]

const travelStats = [
  { title: "Active Bookings", value: "3", icon: Bus, color: "text-blue-600" },
  { title: "Members Traveling", value: "92", icon: Users, color: "text-green-600" },
  { title: "Destinations This Season", value: "12", icon: MapPin, color: "text-purple-600" },
  { title: "Total Revenue", value: "£8,450", icon: Calendar, color: "text-orange-600" },
]

export default function TravelPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Travel & Away Days</h1>
            <p className="text-muted-foreground">Organize group travel for away matches and tournaments</p>
          </div>
          <TravelBookingModal />
        </div>

        {/* Travel Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {travelStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="coach-travel" className="space-y-6">
          <TabsList>
            <TabsTrigger value="coach-travel" className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Coach Travel
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Hotel className="w-4 h-4" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="travel-guide" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Travel Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach-travel" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Coach Travel Bookings</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Search destinations..." className="pl-10 w-64" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Departure/Return</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {travelBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{booking.match}</div>
                        </TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.departure} - {booking.return}
                            </div>
                            <div className="text-muted-foreground">{booking.meetingPoint}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {booking.booked}/{booking.capacity}
                          </div>
                        </TableCell>
                        <TableCell>{booking.price}</TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Hotel Bookings</CardTitle>
                  <Button>
                    <Hotel className="w-4 h-4 mr-2" />
                    Book Hotel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Check-in/Check-out</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead>Price per Night</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotelBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{booking.match}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{booking.checkIn}</div>
                            <div className="text-muted-foreground">{booking.checkOut}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.hotel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Hotel className="w-3 h-3" />
                            {booking.booked}/{booking.rooms}
                          </div>
                        </TableCell>
                        <TableCell>{booking.pricePerNight}</TableCell>
                        <TableCell>
                          <Badge variant="default">{booking.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flight Bookings</CardTitle>
                <CardDescription>Organize group flights for international matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No flight bookings yet</p>
                  <Button className="mt-4">
                    <Plane className="w-4 h-4 mr-2" />
                    Book Group Flight
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="travel-guide" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Destinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Manchester</span>
                    <Badge variant="secondary">5 trips</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Liverpool</span>
                    <Badge variant="secondary">4 trips</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Birmingham</span>
                    <Badge variant="secondary">3 trips</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Newcastle</span>
                    <Badge variant="secondary">2 trips</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Travel Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <h4 className="font-medium">Coach Travel</h4>
                    <p className="text-muted-foreground">Book early for better prices and guaranteed seats</p>
                  </div>
                  <div className="text-sm">
                    <h4 className="font-medium">Away Day Essentials</h4>
                    <p className="text-muted-foreground">Bring ID, match ticket, and club colors</p>
                  </div>
                  <div className="text-sm">
                    <h4 className="font-medium">Meeting Points</h4>
                    <p className="text-muted-foreground">Arrive 15 minutes before departure time</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
