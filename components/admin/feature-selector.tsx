'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { Check, X, Gift, TrendingUp, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingTier {
  tier: string;
  monthly_usd: number;
  bundled_features: string[];
  feature_constraints?: Record<string, number>;
  sla_uptime_percent?: number;
  support_tier?: string;
}

interface AddOn {
  feature_key: string;
  service_id: string;
  name: string;
  description: string;
  monthly_usd: number;
  is_trial_eligible: boolean;
  trial_days?: number;
}

interface FeatureSelectorProps {
  clubId: string;
  currentTier?: string;
  onTierChange?: (newTier: string) => void;
}

export function FeatureSelector({ clubId, currentTier = 'free', onTierChange }: FeatureSelectorProps) {
  const [tiers, setTiers] = useState<BillingTier[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [selectingTier, setSelectingTier] = useState(false);
  const [enabledAddOns, setEnabledAddOns] = useState<Set<string>>(new Set());
  const [trialAddOns, setTrialAddOns] = useState<Set<string>>(new Set());
  const [activeAddOnDetails, setActiveAddOnDetails] = useState<AddOn | null>(null);

  // Load tier and add-on configurations
  useEffect(() => {
    async function loadConfigs() {
      try {
        setLoading(true);
        const [tiersRes, addOnsRes] = await Promise.all([
          apiClient.getAvailableBillingTiers(),
          apiClient.getAvailableAddOns(),
        ]);

        if (tiersRes.success) setTiers(tiersRes.data);
        if (addOnsRes.success) setAddOns(addOnsRes.data);
      } catch (err) {
        console.error('Failed to load configs:', err);
        toast.error('Failed to load billing tiers and add-ons');
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, []);

  // Load current club features
  useEffect(() => {
    async function loadClubFeatures() {
      try {
        const res = await apiClient.getClubFeaturesForSelector(clubId);
        if (res.success) {
          const { billing_tier, flags } = res.data;
          setSelectedTier(billing_tier);

          // Track which add-ons are currently enabled
          const enabled = new Set<string>();
          const trials = new Set<string>();

          for (const flag of flags) {
            if (flag.enabled && addOns.some(a => a.feature_key === flag.key)) {
              enabled.add(flag.key);
              if (flag.state === 'trial') {
                trials.add(flag.key);
              }
            }
          }

          setEnabledAddOns(enabled);
          setTrialAddOns(trials);
        }
      } catch (err) {
        console.error('Failed to load club features:', err);
      }
    }

    if (addOns.length > 0) loadClubFeatures();
  }, [clubId, addOns]);

  const handleSelectTier = async (newTier: string) => {
    if (newTier === selectedTier) return;

    try {
      setSelectingTier(true);
      const res = await apiClient.selectBillingTier(clubId, newTier);

      if (res.success) {
        setSelectedTier(newTier);
        toast.success(`Billing tier changed to ${newTier.toUpperCase()}`);
        onTierChange?.(newTier);
      } else {
        toast.error(res.message || 'Failed to change billing tier');
      }
    } catch (err) {
      console.error('Error changing tier:', err);
      toast.error('Failed to change billing tier');
    } finally {
      setSelectingTier(false);
    }
  };

  const handleEnableAddOn = async (addon: AddOn, startTrial: boolean) => {
    try {
      const res = await apiClient.enableFeatureAddOn(clubId, addon.feature_key, startTrial);

      if (res.success) {
        setEnabledAddOns(prev => new Set(prev).add(addon.feature_key));
        if (startTrial) {
          setTrialAddOns(prev => new Set(prev).add(addon.feature_key));
        }
        toast.success(`${addon.name} ${startTrial ? '(trial)' : ''} enabled`);
      } else {
        toast.error(res.message || `Failed to enable ${addon.name}`);
      }
    } catch (err) {
      console.error('Error enabling add-on:', err);
      toast.error(`Failed to enable ${addon.name}`);
    }
  };

  const handleDisableAddOn = async (addon: AddOn) => {
    try {
      const res = await apiClient.disableFeatureAddOn(clubId, addon.feature_key);

      if (res.success) {
        setEnabledAddOns(prev => {
          const next = new Set(prev);
          next.delete(addon.feature_key);
          return next;
        });
        setTrialAddOns(prev => {
          const next = new Set(prev);
          next.delete(addon.feature_key);
          return next;
        });
        toast.success(`${addon.name} disabled`);
      } else {
        toast.error(res.message || `Failed to disable ${addon.name}`);
      }
    } catch (err) {
      console.error('Error disabling add-on:', err);
      toast.error(`Failed to disable ${addon.name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Tiers Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Select Your Billing Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map(tier => (
            <Card
              key={tier.tier}
              className={cn(
                'cursor-pointer transition-all border-2',
                selectedTier === tier.tier
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <CardHeader>
                <CardTitle className="capitalize text-lg">{tier.tier}</CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  ${tier.monthly_usd}
                  <span className="text-sm text-gray-500">/mo</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tier features preview */}
                <div className="space-y-2">
                  {tier.bundled_features.slice(0, 5).map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {tier.bundled_features.length > 5 && (
                    <div className="text-sm text-gray-500 pl-6">
                      +{tier.bundled_features.length - 5} more features
                    </div>
                  )}
                </div>

                {/* SLA & Support */}
                {tier.sla_uptime_percent && (
                  <div className="pt-2 border-t text-xs text-gray-600 space-y-1">
                    <div>SLA: {tier.sla_uptime_percent}% uptime</div>
                    <div>Support: {tier.support_tier || 'N/A'}</div>
                  </div>
                )}

                <Button
                  onClick={() => handleSelectTier(tier.tier)}
                  disabled={selectingTier || selectedTier === tier.tier}
                  variant={selectedTier === tier.tier ? 'default' : 'outline'}
                  className="w-full"
                >
                  {selectingTier ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : selectedTier === tier.tier ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Current Plan
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Add-ons Section */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Add-on Packages</h2>
        <p className="text-gray-600 mb-6">Enhance your plan with premium features</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addOns.map(addon => {
            const isEnabled = enabledAddOns.has(addon.feature_key);
            const isTrial = trialAddOns.has(addon.feature_key);

            return (
              <Card key={addon.feature_key} className={cn('relative', isEnabled && 'ring-2 ring-green-500')}>
                {isEnabled && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500">
                    {isTrial ? 'TRIAL' : 'ACTIVE'}
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    {addon.name}
                  </CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">${addon.monthly_usd}</div>
                    <div className="text-sm text-gray-500">per month</div>
                    {addon.is_trial_eligible && addon.trial_days && (
                      <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {addon.trial_days}-day trial available
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Service ID: {addon.service_id}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isEnabled ? (
                      <>
                        <Button
                          onClick={() => handleEnableAddOn(addon, false)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          Enable
                        </Button>
                        {addon.is_trial_eligible && (
                          <Button
                            onClick={() => handleEnableAddOn(addon, true)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Try ({addon.trial_days}d)
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={() => handleDisableAddOn(addon)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Disable
                      </Button>
                    )}
                  </div>

                  {isEnabled && isTrial && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>Trial period active. Will revert to OFF if no payment received.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
