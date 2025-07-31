"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Bus, Clock, Trophy } from "lucide-react"

const upcomingFixtures = [
  {
    id: 1,
    opponent: "Manchester City",
    competition: "Premier League",
    date: "May 15, 2025",
    time: "15:00",
    venue: "Emirates Stadium",
    type: "Home",
    ticketsAvailable: true,
    awayDayOrganized: false,
  },
  {
    id: 2,
    opponent: "Liverpool",
    competition: "Premier League",
    date: "May 22, 2025",
    time: "17:30",
    venue: "Anfield",
    type: "Away",
    ticketsAvailable: true,
    awayDayOrganized: true,
  },
  {
    id: 3,
    opponent: "Chelsea",
    competition: "FA Cup Final",
    date: "May 29, 2025",
    time: "15:00",
    venue: "Wembley Stadium",
    type: "Neutral",
    ticketsAvailable: false,
    awayDayOrganized: true,
  },
]

const awayDayEvents = [
  {
    id: 1,
    match: "Arsenal vs Liverpool",
    date: "May 22, 2025",
    departure: "12:00",
    meetingPoint: "Emirates Stadium Car Park",
    busSeats: "45/50",
    price: "£35",
    status: "Open",
  },
  {
    id: 2,
    match: "FA Cup Final",
    date: "May 29, 2025",
    departure: "11:00",
    meetingPoint: "North London Supporters Club",
    busSeats: "50/50",
    price: "£45",
    status: "Full",
  },
]

const matchStats = [
  { title: "Home Attendance", value: "98.5%", icon: Users, color: "text-green-600" },
  { title: "Away Days This Season", value: "18", icon: Bus, color: "text-blue-600" },
  { title: "Average Travel Group", value: "47", icon: Users, color: "text-purple-600" },
  { title: "Season Points", value: "67", icon: Trophy, color: "text-orange-600" },
]

export default function MatchCenterPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match Center</h1>
            <p className="text-muted-foreground">Manage fixtures, away days, and match-related activities</p>
          </div>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Add Match Event
          </Button>
        </div>

        {/* Match Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {matchStats.map((stat) => (
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

        <Tabs defaultValue="fixtures" className="space-y-6">
          <TabsList>
            <TabsTrigger value="fixtures">Upcoming Fixtures</TabsTrigger>
            <TabsTrigger value="away-days">Away Day Travel</TabsTrigger>
            <TabsTrigger value="watch-parties">Watch Parties</TabsTrigger>
            <TabsTrigger value="season-review">Season Review</TabsTrigger>
          </TabsList>

          <TabsContent value="fixtures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Fixtures</CardTitle>
                <CardDescription>Manage match events and supporter activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Away Day</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingFixtures.map((fixture) => (
                      <TableRow key={fixture.id}>
                        <TableCell className="font-medium">Arsenal vs {fixture.opponent}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{fixture.competition}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{fixture.date}</div>
                            <div className="text-sm text-muted-foreground">{fixture.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {fixture.venue}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              fixture.type === "Home" ? "default" : fixture.type === "Away" ? "secondary" : "outline"
                            }
                          >
                            {fixture.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={fixture.ticketsAvailable ? "default" : "destructive"}>
                            {fixture.ticketsAvailable ? "Available" : "Sold Out"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={fixture.awayDayOrganized ? "default" : "secondary"}>
                            {fixture.awayDayOrganized ? "Organized" : "Not Set"}
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

          <TabsContent value="away-days" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Away Day Travel</CardTitle>
                    <CardDescription>Organize group travel for away matches</CardDescription>
                  </div>
                  <Button>
                    <Bus className="w-4 h-4 mr-2" />
                    Organize Travel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Meeting Point</TableHead>
                      <TableHead>Bus Capacity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awayDayEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.match}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.departure}
                          </div>
                        </TableCell>
                        <TableCell>{event.meetingPoint}</TableCell>
                        <TableCell>{event.busSeats}</TableCell>
                        <TableCell>{event.price}</TableCell>
                        <TableCell>
                          <Badge variant={event.status === "Open" ? "default" : "secondary"}>{event.status}</Badge>
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

          <TabsContent value="watch-parties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Watch Parties</CardTitle>
                <CardDescription>Organize viewing events for away matches and cup games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No watch parties scheduled</p>
                  <Button className="mt-4">Create Watch Party</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="season-review" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Season Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Matches Attended</span>
                    <span className="font-medium">32/38</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Away Days Organized</span>
                    <span className="font-medium">18/19</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Members Traveled</span>
                    <span className="font-medium">847</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Attendance</span>
                    <span className="font-medium">47 members</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Destinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Manchester</span>
                    <span className="font-medium">3 trips</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liverpool</span>
                    <span className="font-medium">2 trips</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Birmingham</span>
                    <span className="font-medium">2 trips</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Newcastle</span>
                    <span className="font-medium">1 trip</span>
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
