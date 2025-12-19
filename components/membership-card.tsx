"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Calendar, 
  MapPin, 
  Crown,
  QrCode,
  BarChart3
} from 'lucide-react';
import { PublicMembershipCardDisplay, apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Add Google Fonts for customization
const fontImports = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Montserrat:wght@400;500;600;700&display=swap');
`;

interface MembershipCardProps {
  cardData: PublicMembershipCardDisplay;
  cardStyle?: 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald';
  showLogo?: boolean;
  userName?: string; // User's name to display on the card (replaces card number)
  membershipId?: string | null; // User's membership ID from API
}

export function MembershipCard({ 
  cardData, 
  cardStyle = 'default', 
  showLogo = true,
  userName = 'Member Name', // Default value
  membershipId = null // Default value
}: MembershipCardProps) {
  const { card, club, membershipPlan } = cardData;
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [isHovered, setIsHovered] = useState(false);

  // Style configurations with customization override
  const getStyleConfig = () => {
    // Always check for custom colors first - admin customization takes priority
    if (card.customization?.primaryColor && card.customization?.secondaryColor) {
      return {
        bg: `bg-gradient-to-br`,
        text: 'text-white',
        border: 'border-2',
        accent: 'bg-opacity-80',
        customColors: {
          primary: card.customization.primaryColor,
          secondary: card.customization.secondaryColor
        }
      };
    }

    // Fallback to preset styles only if no custom colors are set
    switch (cardStyle) {
      case 'premium':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
          text: 'text-white',
          border: 'border-yellow-300',
          accent: 'bg-yellow-600',
          customColors: null
        };
      case 'vintage':
        return {
          bg: 'bg-gradient-to-br from-amber-700 via-orange-800 to-red-900',
          text: 'text-amber-100',
          border: 'border-amber-600',
          accent: 'bg-amber-800',
          customColors: null
        };
      case 'modern':
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
          text: 'text-white',
          border: 'border-purple-500',
          accent: 'bg-purple-600',
          customColors: null
        };
      case 'elite':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black',
          text: 'text-white',
          border: 'border-gray-600',
          accent: 'bg-gray-700',
          customColors: null
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
          text: 'text-white',
          border: 'border-emerald-400',
          accent: 'bg-emerald-600',
          customColors: null
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
          text: 'text-white',
          border: 'border-blue-400',
          accent: 'bg-blue-500',
          customColors: null
        };
    }
  };

  const style = getStyleConfig();

  // Get font family from customization or use default
  const getFontFamily = () => {
    if (card.customization?.fontFamily) {
      switch (card.customization.fontFamily) {
        case 'Roboto': return 'font-roboto';
        case 'Open Sans': return 'font-open-sans';
        case 'Montserrat': return 'font-montserrat';
        default: return 'font-inter';
      }
    }
    return 'font-inter';
  };

  const getFontFamilyStyle = () => {
    if (card.customization?.fontFamily) {
      switch (card.customization.fontFamily) {
        case 'Roboto': return { fontFamily: 'Roboto, sans-serif' };
        case 'Open Sans': return { fontFamily: 'Open Sans, sans-serif' };
        case 'Montserrat': return { fontFamily: 'Montserrat, sans-serif' };
        default: return { fontFamily: 'Inter, sans-serif' };
      }
    }
    return { fontFamily: 'Inter, sans-serif' };
  };

  // Get logo size from customization
  const getLogoSize = () => {
    if (card.customization?.logoSize) {
      switch (card.customization.logoSize) {
        case 'small': return 'w-6 h-6';
        case 'large': return 'w-10 h-10';
        default: return 'w-8 h-8';
      }
    }
    return 'w-8 h-8';
  };

  // Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'pending': return 'secondary';
      case 'suspended': return 'outline';
      default: return 'secondary';
    }
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 3D hover effect handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTransform({
      rotateX: -rotateX,
      rotateY: rotateY,
      scale: 1.05
    });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <>
      <style key="font-imports">{fontImports}</style>
      <div
        ref={cardRef}
        className="perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        <Card 
          className={`w-full max-w-lg overflow-hidden ${style.bg} ${style.text} ${style.border} border-2 transition-all duration-300 ease-out cursor-pointer`}
          style={{
            ...getFontFamilyStyle(),
            ...(style.customColors ? {
              background: `linear-gradient(to bottom right, ${style.customColors.primary}, ${style.customColors.secondary})`,
              borderColor: style.customColors.primary
            } : {}),
            aspectRatio: '1.586 / 1',
            transform: `
              perspective(1000px)
              rotateX(${transform.rotateX}deg)
              rotateY(${transform.rotateY}deg)
              scale(${transform.scale})
              translateZ(${isHovered ? '20px' : '0px'})
            `,
            boxShadow: isHovered 
              ? `0 ${20 + transform.rotateX * 2}px ${40 + Math.abs(transform.rotateY) * 2}px rgba(0, 0, 0, 0.3),
                 0 0 ${30 + Math.abs(transform.rotateY) * 3}px ${style.customColors ? style.customColors.primary + '40' : 'rgba(59, 130, 246, 0.2)'}`
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          }}
        >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {showLogo && (card.customization?.customLogo || club.logo) && (
              <Avatar className={getLogoSize()}>
                <AvatarImage 
                  src={card.customization?.customLogo || club.logo} 
                  alt={club.name} 
                />
                <AvatarFallback 
                  className={style.accent}
                  style={style.customColors ? { backgroundColor: style.customColors.primary } : {}}
                >
                  {club.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h3 className="font-bold text-sm truncate">{club.name}</h3>
              <p className="text-xs opacity-80 truncate">{club.location || 'Location'}</p>
            </div>
          </div>
        </div>

        {/* User Name - Main Display (Debit Card Style) */}
        <div className="text-center mb-4">
          <p className="font-bold text-2xl tracking-wide mb-2">
            {userName || 'Member'}
          </p>
                     {/* Display Membership ID prominently like a card number */}
           <div className="mb-2">
             <p className="text-xs opacity-80 mb-1">Membership ID</p>
             <p className="text-lg font-mono tracking-widest font-semibold opacity-90">
               {membershipId || 'UM-2024-123456ABC'}
             </p>
           </div>
        </div>

        {/* Plan Info - Less prominent for debit card style */}
        <div className="text-center mb-2">
          <p className="text-xs opacity-70 mb-1">Plan</p>
          <p className="text-sm font-medium truncate">{membershipPlan.name}</p>
        </div>

        {/* Footer - Debit Card Style */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs opacity-70 mb-1">Valid Thru</p>
            <p className="text-sm font-medium">{formatDate(card.expiryDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70 mb-1">Status</p>
            <Badge variant={getStatusVariant(card.status)} className="text-xs">
              {card.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
    </>
  );
}

// Preview component for admins to see different card styles
export function MembershipCardPreview() {
  const [cards, setCards] = useState<PublicMembershipCardDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getMyMembershipCards()
        
        if (response.success && response.data) {
          setCards(response.data)
        } else {
          setError(response.error || 'Failed to fetch membership cards')
        }
      } catch (err) {
        setError('Failed to fetch membership cards')
        toast({
          title: "Error",
          description: "Failed to fetch membership cards",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Card Style Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Loading your membership cards...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Card Style Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Error loading membership cards
          </p>
        </div>
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Card Style Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any membership cards yet
          </p>
        </div>
        <div className="text-center text-muted-foreground">
          <p>No membership cards found</p>
        </div>
      </div>
    )
  }

  const cardStyles = ['default', 'premium', 'vintage', 'modern']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Card Style Preview</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Preview different card styles for your membership cards
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStyles.map((style) => (
          <div key={style} className="text-center">
            <h4 className="font-medium mb-3 text-foreground capitalize">{style}</h4>
            <div className="flex justify-center">
              <MembershipCard
                cardData={cards[0]}
                cardStyle={style as any}
                showLogo={true}
                membershipId={cards[0]?.card?.membershipId || null}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
