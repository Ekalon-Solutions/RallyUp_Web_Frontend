'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search, Download,
  Mail,
  Phone,
  Calendar,
  Clock,
  Award, Loader2,
  CheckCircle,
  XCircle,
  UserCheck,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import config from '@/lib/config';
import { triggerBlobDownload, formatDisplayDate } from '@/lib/utils';
import { Volunteer } from '@/lib/api';

interface AdminVolunteerListProps {
  clubId: string;
  currentUser: any;
}

export default function AdminVolunteerList({ clubId, currentUser }: AdminVolunteerListProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVolunteers();
  }, [clubId]);

  useEffect(() => {
    filterVolunteers();
  }, [volunteers, searchTerm, statusFilter, availabilityFilter]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (clubId) queryParams.append('club', clubId);

      const response = await fetch(
        `${config.apiBaseUrl}/volunteer/volunteers?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      } else {
        throw new Error('Failed to fetch volunteers');
      }
    } catch (error) {
      // console.error('Error fetching volunteers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load volunteers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVolunteers = () => {
    let filtered = [...volunteers];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((volunteer) => {
        const userName = `${volunteer.user?.first_name || ''} ${volunteer.user?.last_name || ''}`.toLowerCase();
        const email = volunteer.user?.email?.toLowerCase() || '';
        const skills = volunteer.skills?.join(' ').toLowerCase() || '';
        return userName.includes(search) || email.includes(search) || skills.includes(search);
      });
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((v) => v.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((v) => !v.isActive);
      } else {
        filtered = filtered.filter((v) => v.status === statusFilter);
      }
    }

    if (availabilityFilter !== 'all') {
      filtered = filtered.filter((v) => {
        if (availabilityFilter === 'weekdays') return v.availability?.weekdays;
        if (availabilityFilter === 'weekends') return v.availability?.weekends;
        if (availabilityFilter === 'evenings') return v.availability?.evenings;
        if (availabilityFilter === 'flexible') return v.availability?.flexible;
        return true;
      });
    }

    setFilteredVolunteers(filtered);
  };

  const getStatusBadge = (volunteer: Volunteer) => {
    if (!volunteer.isActive) {
      return <Badge variant="secondary" className="bg-gray-200"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
    switch (volunteer.status) {
      case 'available':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case 'busy':
        return <Badge variant="default" className="bg-yellow-500">Busy</Badge>;
      case 'on-assignment':
        return <Badge variant="default" className="bg-blue-500">On Assignment</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'V';
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Skills', 'Availability'];
    const rows = filteredVolunteers.map((v) => [
      `${v.user?.first_name || ''} ${v.user?.last_name || ''}`,
      v.user?.email || '',
      v.user?.phoneNumber || '',
      v.isActive ? v.status : 'inactive',
      v.skills?.join(', ') || '',
      [
        v.availability?.weekdays && 'Weekdays',
        v.availability?.weekends && 'Weekends',
        v.availability?.evenings && 'Evenings',
        v.availability?.flexible && 'Flexible',
      ]
        .filter(Boolean)
        .join(', '),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const filename = `volunteers-${new Date().toISOString().split('T')[0]}.csv`;
    triggerBlobDownload(blob, filename);

    toast({
      title: 'Export Successful',
      description: 'Volunteer list exported to CSV',
    });
  };

  const getStatistics = () => {
    const total = volunteers.length;
    const active = volunteers.filter((v) => v.isActive).length;
    const available = volunteers.filter((v) => v.isActive && v.status === 'available').length;
    const onAssignment = volunteers.filter((v) => v.status === 'on-assignment').length;
    return { total, active, available, onAssignment };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Volunteers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On Assignment</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.onAssignment}</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Volunteer List
                </CardTitle>
                <CardDescription>Manage and view all volunteers who have opted in</CardDescription>
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="on-assignment">On Assignment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                  <SelectItem value="evenings">Evenings</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVolunteers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No volunteers found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.map((volunteer) => (
                      <TableRow key={volunteer._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={volunteer.user?.profilePicture} />
                              <AvatarFallback className="bg-blue-500 text-white">
                                {getInitials(volunteer.user?.first_name, volunteer.user?.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {volunteer.user?.first_name} {volunteer.user?.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Member since {formatDisplayDate(volunteer.createdAt)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {volunteer.user?.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 mr-1" />
                                {volunteer.user.email}
                              </div>
                            )}
                            {volunteer.user?.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {volunteer.user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(volunteer)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {volunteer.skills && volunteer.skills.length > 0 ? (
                              volunteer.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No skills listed</span>
                            )}
                            {volunteer.skills && volunteer.skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{volunteer.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.availability?.weekdays && (
                              <Badge variant="outline" className="text-xs">Weekdays</Badge>
                            )}
                            {volunteer.availability?.weekends && (
                              <Badge variant="outline" className="text-xs">Weekends</Badge>
                            )}
                            {volunteer.availability?.evenings && (
                              <Badge variant="outline" className="text-xs">Evenings</Badge>
                            )}
                            {volunteer.availability?.flexible && (
                              <Badge variant="outline" className="text-xs">Flexible</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVolunteer(volunteer);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedVolunteer?.user?.profilePicture} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {getInitials(selectedVolunteer?.user?.first_name, selectedVolunteer?.user?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold text-foreground leading-tight">
                  {selectedVolunteer?.user?.first_name} {selectedVolunteer?.user?.last_name}
                </p>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">{selectedVolunteer?.user?.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>Complete volunteer profile and information</DialogDescription>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Status</h4>
                {getStatusBadge(selectedVolunteer)}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {selectedVolunteer.user?.email && (
                    <div className="flex items-center text-sm text-foreground">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedVolunteer.user.email}
                    </div>
                  )}
                  {selectedVolunteer.user?.phoneNumber && (
                    <div className="flex items-center text-sm text-foreground">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedVolunteer.user.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedVolunteer.interests && selectedVolunteer.interests.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Availability</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { label: 'Weekdays', value: selectedVolunteer.availability?.weekdays },
                      { label: 'Weekends', value: selectedVolunteer.availability?.weekends },
                      { label: 'Evenings', value: selectedVolunteer.availability?.evenings },
                      { label: 'Flexible', value: selectedVolunteer.availability?.flexible },
                    ] as { label: string; value: boolean | undefined }[]
                  ).map(({ label, value }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        value
                          ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">{label}</span>
                      <span className="ml-auto">{value ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVolunteer.experience && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Experience</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-foreground">
                      <Award className="w-4 h-4 mr-2 text-muted-foreground" />
                      Level: <span className="font-medium ml-1 capitalize">{selectedVolunteer.experience.level}</span>
                    </div>
                    <div className="flex items-center text-sm text-foreground">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      Years: <span className="font-medium ml-1">{selectedVolunteer.experience.yearsOfExperience}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedVolunteer.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md border">
                    {selectedVolunteer.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Joined</h4>
                <div className="flex items-center text-sm text-foreground">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  {formatDisplayDate(selectedVolunteer.createdAt)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
