"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { MembershipCard } from '@/components/membership-card';
import { Upload, Save, Eye, Palette, Type, Image as ImageIcon } from 'lucide-react';

// Card style presets
const CARD_STYLES = [
  { value: 'default', label: 'Default Blue', colors: { primary: '#2563eb', secondary: '#1e40af' } },
  { value: 'premium', label: 'Premium Gold', colors: { primary: '#fbbf24', secondary: '#dc2626' } },
  { value: 'vintage', label: 'Vintage Amber', colors: { primary: '#b45309', secondary: '#7c2d12' } },
  { value: 'modern', label: 'Modern Purple', colors: { primary: '#1e293b', secondary: '#581c87' } },
  { value: 'custom', label: 'Custom Colors', colors: null }
];

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' }
];

const LOGO_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
];

interface MembershipCardCustomizerProps {
  cardId?: string;
  onSave?: () => void;
}

export function MembershipCardCustomizer({ cardId, onSave }: MembershipCardCustomizerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  
  // Customization state
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch existing card data
  useEffect(() => {
    const fetchCardData = async () => {
      try {
        setLoading(true);
        // For now, fetch user's cards as sample data
        const response = await apiClient.getMyMembershipCards();
        
        if (response.success && response.data && response.data.length > 0) {
          const card = response.data[0];
          setCardData(card);
          
          // Load existing customization if any
          if (card.card.customization) {
            const custom = card.card.customization;
            if (custom.primaryColor) setPrimaryColor(custom.primaryColor);
            if (custom.secondaryColor) setSecondaryColor(custom.secondaryColor);
            if (custom.fontFamily) setFontFamily(custom.fontFamily);
            if (custom.logoSize) setLogoSize(custom.logoSize);
            if (custom.customLogo) setCustomLogo(custom.customLogo);
            
            // Check if using preset or custom colors
            const preset = CARD_STYLES.find(s => 
              s.colors?.primary === custom.primaryColor && 
              s.colors?.secondary === custom.secondaryColor
            );
            setSelectedStyle(preset ? preset.value : 'custom');
          }
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
        toast({
          title: "Error",
          description: "Failed to load membership card",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [cardId, toast]);

  // Handle style preset change
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    const preset = CARD_STYLES.find(s => s.value === style);
    if (preset && preset.colors) {
      setPrimaryColor(preset.colors.primary);
      setSecondaryColor(preset.colors.secondary);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);

      // Upload to your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setCustomLogo(data.url);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save customization
  const handleSave = async () => {
    if (!cardData) return;

    try {
      setSaving(true);
      
      const customization = {
        primaryColor,
        secondaryColor,
        fontFamily,
        logoSize,
        customLogo: customLogo || undefined
      };

      // Get membership plan ID from card data
      const membershipPlanId = cardData.membershipPlan._id;

      // Use the template card update endpoint
      const response = await apiClient.updateTemplateCardCustomization(
        membershipPlanId,
        customization
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Card customization saved successfully",
        });
        if (onSave) onSave();
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Membership Card</CardTitle>
          <CardDescription>
            No membership card found to customize
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Create preview data with current customization
  const previewData = {
    ...cardData,
    card: {
      ...cardData.card,
      customization: {
        primaryColor,
        secondaryColor,
        fontFamily,
        logoSize,
        customLogo
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Membership Card Customizer
          </CardTitle>
          <CardDescription>
            Customize the appearance of your club's membership cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="style">
                <Palette className="w-4 h-4 mr-2" />
                Style
              </TabsTrigger>
              <TabsTrigger value="logo">
                <ImageIcon className="w-4 h-4 mr-2" />
                Logo
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="space-y-6">
              {/* Card Style Presets */}
              <div className="space-y-3">
                <Label>Card Style Preset</Label>
                <Select value={selectedStyle} onValueChange={handleStyleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setSelectedStyle('custom');
                      }}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setSelectedStyle('custom');
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setSelectedStyle('custom');
                      }}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setSelectedStyle('custom');
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <Label>Font Family</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Logo Size */}
              <div className="space-y-3">
                <Label>Logo Size</Label>
                <Select value={logoSize} onValueChange={(value) => setLogoSize(value as 'small' | 'medium' | 'large')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGO_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Custom Logo</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a custom logo for your membership cards (max 2MB)
                  </p>
                </div>

                {customLogo && (
                  <div className="flex items-center justify-center p-4 border rounded-lg">
                    <img 
                      src={customLogo} 
                      alt="Custom logo" 
                      className="max-w-[200px] max-h-[200px] object-contain"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploadingLogo}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  {customLogo && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setCustomLogo(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the card will appear to members
                  </p>
                </div>

                <div className="flex justify-center py-8 bg-muted/30 rounded-lg">
                  <MembershipCard
                    cardData={previewData}
                    cardStyle="default"
                    showLogo={true}
                    userName="John Doe"
                    membershipId={previewData.card.membershipId}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                // Reset to default
                setSelectedStyle('default');
                setPrimaryColor('#2563eb');
                setSecondaryColor('#1e40af');
                setFontFamily('Inter');
                setLogoSize('medium');
                setCustomLogo(null);
              }}
            >
              Reset to Default
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Customization'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
