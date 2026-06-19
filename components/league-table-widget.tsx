'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Standing {
  idStanding: string;
  intRank: string;
  idTeam: string;
  strTeam: string;
  strBadge: string;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  strForm: string;
  strDescription: string;
  intPlayed: string;
  intWin: string;
  intLoss: string;
  intDraw: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
  dateUpdated: string;
}

interface LeagueTableWidgetProps {
  leagueId: string;
  highlightTeamId?: string;
  highlightTeamName?: string;
}

export default function LeagueTableWidget({ leagueId, highlightTeamId, highlightTeamName }: LeagueTableWidgetProps) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadLeagueTable();
  }, [leagueId]);

  const loadLeagueTable = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await apiClient.getLeagueTable(leagueId);
      console.log("llt resp:", resp)
      if (resp.success && resp.data?.data?.standings) {
        setStandings(resp.data.data.standings);
      } else {
        setError('Failed to load league table');
      }
    } catch (e: any) {
      setError('Error loading league table');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayedStandings = showAll ? standings : standings.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">League Table</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">League Table</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-muted-foreground">{error || 'No standings available'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{standings[0]?.strLeague || 'League Table'}</CardTitle>
          <span className="text-xs text-muted-foreground">Season: {standings[0]?.strSeason}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>{[
                { key: 'position', className: 'text-center px-2 py-2 font-semibold', label: 'Position' },
                { key: 'team', className: 'text-left px-2 py-2 font-semibold', label: 'Team' },
                { key: 'form', className: 'text-center px-2 py-2 font-semibold', label: 'Form' },
                { key: 'played', className: 'text-center px-2 py-2 font-semibold', label: 'P' },
                { key: 'win', className: 'text-center px-2 py-2 font-semibold', label: 'W' },
                { key: 'draw', className: 'text-center px-2 py-2 font-semibold', label: 'D' },
                { key: 'loss', className: 'text-center px-2 py-2 font-semibold', label: 'L' },
                { key: 'gd', className: 'text-center px-2 py-2 font-semibold', label: 'GD' },
                { key: 'pts', className: 'text-center px-2 py-2 font-semibold', label: 'Pts' },
              ].map((col) => (
                <th key={col.key} className={col.className}>{col.label}</th>
              ))}</tr>
            </thead>
            <tbody>
              {displayedStandings.map((standing) => (
                <tr key={standing.idStanding} className="border-b hover:bg-muted/40">{[
                  <td key="rank" className="text-center px-2 py-3 font-semibold text-black dark:text-white">{standing.intRank}</td>,
                  <td key="team" className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      {standing.strBadge && (
                        <img
                          src={standing.strBadge}
                          alt={standing.strTeam}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span className="font-medium">{standing.strTeam}</span>
                    </div>
                  </td>,
                  <td key="form" className="text-center px-2 py-3">
                    {standing.strForm ? (
                      <span className="inline-flex items-center justify-center gap-1">
                        {String(standing.strForm).split('').map((ch, idx) => {
                          const c = (ch || '').toUpperCase();
                          if (c === 'W') return <img key={idx} src="/Green_Check.svg" alt="Win" className="w-4 h-4" />;
                          if (c === 'L') return <img key={idx} src="/Red-Cross.svg" alt="Loss" className="w-4 h-4" />;
                          if (c === 'D') return <img key={idx} src="/Grey_Dash.svg" alt="Draw" className="w-4 h-4" />;
                          return <img key={idx} src="/Grey_Dash.svg" alt="-" className="w-4 h-4" />;
                        })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>,
                  <td key="played" className="text-center px-2 py-3">{standing.intPlayed}</td>,
                  <td key="win" className="text-center px-2 py-3 text-green-600 font-semibold">{standing.intWin}</td>,
                  <td key="draw" className="text-center px-2 py-3 text-orange-600 font-semibold">{standing.intDraw}</td>,
                  <td key="loss" className="text-center px-2 py-3 text-red-600 font-semibold">{standing.intLoss}</td>,
                  <td key="gd" className="text-center px-2 py-3 font-semibold">{standing.intGoalDifference}</td>,
                  <td key="pts" className="text-center px-2 py-3 font-bold text-lg">{standing.intPoints}</td>,
                ]}</tr>
              ))}
            </tbody>
          </table>
        </div>

        {standings.length > 5 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-2 text-black dark:text-white"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show All {standings.length} Teams
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
