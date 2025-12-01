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
import { triggerBlobDownload } from '@/lib/utils';
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
      // // console.error('Error fetching volunteers:', error);
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

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((volunteer) => {
        const userName = `${volunteer.user?.first_name || ''} ${volunteer.user?.last_name || ''}`.toLowerCase();
        const email = volunteer.user?.email?.toLowerCase() || '';
        const skills = volunteer.skills?.join(' ').toLowerCase() || '';
        return userName.includes(search) || email.includes(search) || skills.includes(search);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((v) => v.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((v) => !v.isActive);
      } else {
        filtered = filtered.filter((v) => v.status === statusFilter);
      }
    }

    // Availability filter
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
      v.user?.phone_number || '',
      v.isActive ? v.status : 'inactive',
      v.skills?.join(', ') || '',
      [
        v.availability?.weekdays && 'Weekdays',
        v.availability?.weekends && 'Weekends',
        v.availability?.evenings && 'Evenings',
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
        {/* Statistics Cards */}
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

        {/* Main Content */}
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

            {/* Filters */}
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
                                Member since {new Date(volunteer.createdAt).toLocaleDateString()}
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
                            {volunteer.user?.phone_number && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {volunteer.user.phone_number}
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

      {/* Volunteer Details Modal */}
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
                <p className="text-xl">
                  {selectedVolunteer?.user?.first_name} {selectedVolunteer?.user?.last_name}
                </p>
                <p className="text-sm font-normal text-gray-500">{selectedVolunteer?.user?.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>Complete volunteer profile and information</DialogDescription>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Status</h4>
                {getStatusBadge(selectedVolunteer)}
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {selectedVolunteer.user?.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedVolunteer.user.email}
                    </div>
                  )}
                  {selectedVolunteer.user?.phone_number && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedVolunteer.user.phone_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
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

              {/* Interests */}
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

              {/* Availability */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Availability</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      Weekdays: {selectedVolunteer.availability?.weekdays ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      Weekends: {selectedVolunteer.availability?.weekends ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      Evenings: {selectedVolunteer.availability?.evenings ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      Flexible: {selectedVolunteer.availability?.flexible ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Experience */}
              {selectedVolunteer.experience && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Experience</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Award className="w-4 h-4 mr-2 text-gray-400" />
                      Level: <span className="font-medium ml-1 capitalize">{selectedVolunteer.experience.level}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Years: <span className="font-medium ml-1">{selectedVolunteer.experience.yearsOfExperience}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedVolunteer.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedVolunteer.notes}
                  </p>
                </div>
              )}

              {/* Joined Date */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Joined</h4>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(selectedVolunteer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
