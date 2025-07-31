"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Plus, Settings, BarChart3, LinkIcon } from "lucide-react"

const integrations = [
  {
    name: "Ticketmaster",
    status: "Connected",
    description: "Official match tickets and events",
    lastSync: "2 hours ago",
    events: 5,
  },
  {
    name: "StubHub",
    status: "Available",
    description: "Secondary ticket marketplace",
    lastSync: "Never",
    events: 0,
  },
  {
    name: "SeatGeek",
    status: "Available",
    description: "Ticket resale platform",
    lastSync: "Never",
    events: 0,
  },
]

const externalEvents = [
  {
    id: 1,
    title: "Arsenal vs Manchester City",
    venue: "Emirates Stadium",
    date: "May 15, 2025",
    time: "3:00 PM",
    platform: "Ticketmaster",
    ticketsAvailable: 1250,
    priceRange: "£45 - £150",
    status: "On Sale",
  },
  {
    id: 2,
    title: "Arsenal vs Liverpool",
    venue: "Emirates Stadium",
    date: "May 22, 2025",
    time: "5:30 PM",
    platform: "Ticketmaster",
    ticketsAvailable: 890,
    priceRange: "£50 - £180",
    status: "On Sale",
  },
]

export default function ExternalTicketingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">External Ticketing</h1>
            <p className="text-muted-foreground">Integrate with external ticketing platforms and manage ticket sales</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              External Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card key={integration.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant={integration.status === "Connected" ? "default" : "secondary"}>
                        {integration.status}
                      </Badge>
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span>{integration.lastSync}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Events:</span>
                        <span>{integration.events}</span>
                      </div>
                    </div>
                    <Button className="w-full" variant={integration.status === "Connected" ? "outline" : "default"}>
                      {integration.status === "Connected" ? "Configure" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>External Events</CardTitle>
                <CardDescription>Events from connected ticketing platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.venue}</TableCell>
                        <TableCell>
                          <div>
                            <div>{event.date}</div>
                            <div className="text-sm text-muted-foreground">{event.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.platform}</Badge>
                        </TableCell>
                        <TableCell>{event.ticketsAvailable.toLocaleString()}</TableCell>
                        <TableCell>{event.priceRange}</TableCell>
                        <TableCell>
                          <Badge variant="default">{event.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total External Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,847</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£284,750</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£14,238</div>
                  <p className="text-xs text-muted-foreground">5% commission rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">Ticketmaster connected</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>External ticket sales over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Sales chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>External Ticketing Settings</CardTitle>
                <CardDescription>Configure how external ticketing integrations work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-sync">Auto Sync Events</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync events from connected platforms
                      </p>
                    </div>
                    <Switch id="auto-sync" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="member-notifications">Member Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify members when new tickets become available</p>
                    </div>
                    <Switch id="member-notifications" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="price-alerts">Price Drop Alerts</Label>
                      <p className="text-sm text-muted-foreground">Alert members when ticket prices drop</p>
                    </div>
                    <Switch id="price-alerts" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="commission-tracking">Commission Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track commission from external sales</p>
                    </div>
                    <Switch id="commission-tracking" defaultChecked />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sync-frequency">Sync Frequency (minutes)</Label>
                    <Input id="sync-frequency" type="number" defaultValue="30" className="w-32" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
                    <Input id="commission-rate" type="number" defaultValue="5" className="w-32" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://your-domain.com/webhook/tickets"
                      className="max-w-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
